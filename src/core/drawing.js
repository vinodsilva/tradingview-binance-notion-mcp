/**
 * Core drawing logic.
 */
import { evaluate as _evaluate, evaluateAsync as _evaluateAsync, getChartApi as _getChartApi, safeString, requireFinite } from '../connection.js';

function _resolve(deps) {
  return { evaluate: deps?.evaluate || _evaluate, evaluateAsync: deps?.evaluateAsync || _evaluateAsync, getChartApi: deps?.getChartApi || _getChartApi };
}

export async function drawShape({ shape, point, point2, overrides: overridesRaw, text, _deps }) {
  const { evaluate, getChartApi } = _resolve(_deps);
  const overrides = overridesRaw ? (typeof overridesRaw === 'string' ? JSON.parse(overridesRaw) : overridesRaw) : {};
  const apiPath = await getChartApi();
  const overridesStr = JSON.stringify(overrides || {});
  const textStr = text ? JSON.stringify(text) : '""';

  const p1time = requireFinite(point.time, 'point.time');
  const p1price = requireFinite(point.price, 'point.price');

  const before = await evaluate(`${apiPath}.getAllShapes().map(function(s) { return s.id; })`);

  if (point2) {
    const p2time = requireFinite(point2.time, 'point2.time');
    const p2price = requireFinite(point2.price, 'point2.price');
    await evaluate(`
      ${apiPath}.createMultipointShape(
        [{ time: ${p1time}, price: ${p1price} }, { time: ${p2time}, price: ${p2price} }],
        { shape: ${safeString(shape)}, overrides: ${overridesStr}, text: ${textStr} }
      )
    `);
  } else {
    await evaluate(`
      ${apiPath}.createShape(
        { time: ${p1time}, price: ${p1price} },
        { shape: ${safeString(shape)}, overrides: ${overridesStr}, text: ${textStr} }
      )
    `);
  }

  await new Promise(r => setTimeout(r, 200));
  const after = await evaluate(`${apiPath}.getAllShapes().map(function(s) { return s.id; })`);
  const newId = (after || []).find(id => !(before || []).includes(id)) || null;
  const result = { entity_id: newId };
  return { success: true, shape, entity_id: result?.entity_id };
}

export async function listDrawings() {
  const apiPath = await _getChartApi();
  const shapes = await _evaluate(`
    (function() {
      var api = ${apiPath};
      var all = api.getAllShapes();
      return all.map(function(s) { return { id: s.id, name: s.name }; });
    })()
  `);
  return { success: true, count: shapes?.length || 0, shapes: shapes || [] };
}

export async function getProperties({ entity_id }) {
  const apiPath = await _getChartApi();
  const result = await _evaluate(`
    (function() {
      var api = ${apiPath};
      var eid = ${safeString(entity_id)};
      var props = { entity_id: eid };
      var shape = api.getShapeById(eid);
      if (!shape) return { error: 'Shape not found: ' + eid };
      var methods = [];
      try { for (var key in shape) { if (typeof shape[key] === 'function') methods.push(key); } props.available_methods = methods; } catch(e) {}
      try { var pts = shape.getPoints(); if (pts) props.points = pts; } catch(e) { props.points_error = e.message; }
      try { var ovr = shape.getProperties(); if (ovr) props.properties = ovr; } catch(e) {
        try { var ovr2 = shape.properties(); if (ovr2) props.properties = ovr2; } catch(e2) { props.properties_error = e2.message; }
      }
      try { props.visible = shape.isVisible(); } catch(e) {}
      try { props.locked = shape.isLocked(); } catch(e) {}
      try { props.selectable = shape.isSelectionEnabled(); } catch(e) {}
      try {
        var all = api.getAllShapes();
        for (var i = 0; i < all.length; i++) { if (all[i].id === eid) { props.name = all[i].name; break; } }
      } catch(e) {}
      return props;
    })()
  `);
  if (result?.error) throw new Error(result.error);
  return { success: true, ...result };
}

export async function removeOne({ entity_id }) {
  const apiPath = await _getChartApi();
  const result = await _evaluate(`
    (function() {
      var api = ${apiPath};
      var eid = ${safeString(entity_id)};
      var before = api.getAllShapes();
      var found = false;
      for (var i = 0; i < before.length; i++) { if (before[i].id === eid) { found = true; break; } }
      if (!found) return { removed: false, error: 'Shape not found: ' + eid, available: before.map(function(s) { return s.id; }) };
      api.removeEntity(eid);
      var after = api.getAllShapes();
      var stillExists = false;
      for (var j = 0; j < after.length; j++) { if (after[j].id === eid) { stillExists = true; break; } }
      return { removed: !stillExists, entity_id: eid, remaining_shapes: after.length };
    })()
  `);
  if (result?.error) throw new Error(result.error);
  return { success: true, entity_id: result?.entity_id, removed: result?.removed, remaining_shapes: result?.remaining_shapes };
}

export async function clearAll() {
  const apiPath = await _getChartApi();
  await _evaluate(`${apiPath}.removeAllShapes()`);
  return { success: true, action: 'all_shapes_removed' };
}

export async function drawForecast({ direction, entry, targets, stop_loss, bars_forward, _deps }) {
  const { evaluate, getChartApi } = _resolve(_deps);
  const apiPath = await getChartApi();

  const resolution = await evaluate(`${apiPath}.resolution()`);
  const visibleRange = await evaluate(`${apiPath}.getVisibleRange()`);
  const currentTime = visibleRange.to || Math.floor(Date.now() / 1000);

  let secsPerBar = 60;
  const res = String(resolution);
  if (res === 'D' || res === '1D') secsPerBar = 86400;
  else if (res === 'W' || res === '1W') secsPerBar = 604800;
  else if (res === 'M' || res === '1M') secsPerBar = 2592000;
  else { const mins = parseInt(res, 10); if (!isNaN(mins)) secsPerBar = mins * 60; }

  const bf = bars_forward || 30;
  const isLong = direction === 'long';
  const lineColor = isLong ? '#22ab94' : '#f23645';
  const textColor = isLong ? '#22ab94' : '#f23645';

  const drawn = [];

  if (stop_loss) {
    await evaluate(`
      ${apiPath}.createShape(
        { time: ${currentTime}, price: ${stop_loss} },
        { shape: 'horizontal_line', overrides: { linecolor: '#f23645', linewidth: 1, lineStyle: 2 }, text: 'SL ${stop_loss}' }
      )
    `);
    drawn.push({ type: 'stop_loss', price: stop_loss });
  }

  await evaluate(`
    ${apiPath}.createShape(
      { time: ${currentTime}, price: ${entry} },
      { shape: 'horizontal_line', overrides: { linecolor: ${JSON.stringify(lineColor)}, linewidth: 1, lineStyle: 2 }, text: 'Entry ${entry}' }
    )
  `);
  drawn.push({ type: 'entry', price: entry });

  for (const t of targets) {
    const futureTime = currentTime + (bf * secsPerBar);
    const label = t.label || ('TP ' + t.price);

    await evaluate(`
      ${apiPath}.createShape(
        { time: ${futureTime}, price: ${t.price} },
        { shape: 'horizontal_line', overrides: { linecolor: ${JSON.stringify(textColor)}, linewidth: 1, lineStyle: 2 }, text: ${JSON.stringify(label)} }
      )
    `);

    await evaluate(`
      ${apiPath}.createMultipointShape(
        [{ time: ${currentTime}, price: ${entry} }, { time: ${futureTime}, price: ${t.price} }],
        { shape: 'trend_line', overrides: { linecolor: ${JSON.stringify(lineColor)}, linewidth: 2, lineStyle: 2 }, text: '' }
      )
    `);

    drawn.push({ type: 'target', price: t.price, label, time: futureTime });
  }

  return { success: true, direction, entry, targets: targets.length, drawn, resolution, bars_forward: bf };
}

export async function drawPosition({ direction, entry_time, entry_price, stop_loss, targets, text, quantity, _deps }) {
  const { evaluate, evaluateAsync, getChartApi } = _resolve(_deps);
  const apiPath = await getChartApi();
  const isLong = direction === 'long';
  const lineColor = isLong ? '#22ab94' : '#f23645';

  await evaluate(`
    ${apiPath}.createPositionLine({
      text: ${safeString(text || (isLong ? 'LONG' : 'SHORT'))},
      direction: ${safeString(direction)},
      entryPrice: ${entry_price},
      entryTime: ${entry_time},
      stopLoss: ${stop_loss},
      takeProfit: ${targets && targets.length > 0 ? targets[0].price : 0},
      quantity: ${quantity || 1}
    })
  `);

  await new Promise(r => setTimeout(r, 300));

  if (targets && targets.length > 1) {
    for (let i = 1; i < targets.length; i++) {
      const t = targets[i];
      await evaluate(`
        ${apiPath}.createShape(
          { time: ${entry_time}, price: ${t.price} },
          { shape: 'horizontal_line', overrides: { linecolor: ${JSON.stringify(lineColor)}, linewidth: 2, linestyle: 2 }, text: ${JSON.stringify(t.label || 'TP' + (i + 1) + ' ' + t.price)} }
        )
      `);
    }
  }

  return {
    success: true, direction, entry_price, stop_loss,
    targets_count: targets?.length || 0,
    target_prices: (targets || []).map(t => t.price),
  };
}
