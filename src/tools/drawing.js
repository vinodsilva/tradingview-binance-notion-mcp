import { z } from 'zod';
import { jsonResult } from './_format.js';
import * as core from '../core/drawing.js';

export function registerDrawingTools(server) {
  server.tool('draw_shape', 'Draw a shape/line on the chart', {
    shape: z.string().describe('Shape type: horizontal_line, vertical_line, trend_line, rectangle, text'),
    point: z.object({ time: z.coerce.number(), price: z.coerce.number() }).describe('{ time: unix_timestamp, price: number }'),
    point2: z.object({ time: z.coerce.number(), price: z.coerce.number() }).optional().describe('Second point for two-point shapes (trend_line, rectangle)'),
    overrides: z.string().optional().describe('JSON string of style overrides (e.g., \'{"linecolor": "#ff0000", "linewidth": 2}\')'),
    text: z.string().optional().describe('Text content for text shapes'),
  }, async ({ shape, point, point2, overrides, text }) => {
    try { return jsonResult(await core.drawShape({ shape, point, point2, overrides, text })); }
    catch (err) { return jsonResult({ success: false, error: err.message }, true); }
  });

  server.tool('draw_list', 'List all shapes/drawings on the chart', {}, async () => {
    try { return jsonResult(await core.listDrawings()); }
    catch (err) { return jsonResult({ success: false, error: err.message }, true); }
  });

  server.tool('draw_clear', 'Remove all drawings from the chart', {}, async () => {
    try { return jsonResult(await core.clearAll()); }
    catch (err) { return jsonResult({ success: false, error: err.message }, true); }
  });

  server.tool('draw_remove_one', 'Remove a specific drawing by entity ID', {
    entity_id: z.string().describe('Entity ID of the drawing to remove (from draw_list)'),
  }, async ({ entity_id }) => {
    try { return jsonResult(await core.removeOne({ entity_id })); }
    catch (err) { return jsonResult({ success: false, error: err.message }, true); }
  });

  server.tool('draw_get_properties', 'Get properties and points of a specific drawing', {
    entity_id: z.string().describe('Entity ID of the drawing (from draw_list)'),
  }, async ({ entity_id }) => {
    try { return jsonResult(await core.getProperties({ entity_id })); }
    catch (err) { return jsonResult({ success: false, error: err.message }, true); }
  });

  server.tool('draw_position', 'Draw a Long/Short Position with entry, stop loss, and targets using native TradingView position tool', {
    direction: z.enum(['long', 'short']).describe('Position direction'),
    entry_time: z.coerce.number().describe('Entry time (unix timestamp)'),
    entry_price: z.coerce.number().describe('Entry price'),
    stop_loss: z.coerce.number().describe('Stop loss price'),
    targets: z.array(z.object({
      price: z.coerce.number(),
      label: z.string().optional(),
    })).optional().describe('Target price levels'),
    text: z.string().optional().describe('Label text for the position'),
    quantity: z.coerce.number().optional().describe('Position quantity (default 1)'),
  }, async ({ direction, entry_time, entry_price, stop_loss, targets, text, quantity }) => {
    try { return jsonResult(await core.drawPosition({ direction, entry_time, entry_price, stop_loss, targets, text, quantity })); }
    catch (err) { return jsonResult({ success: false, error: err.message }, true); }
  });

  server.tool('draw_forecast', 'Draw a price forecast with projected trend lines and target labels', {
    direction: z.enum(['long', 'short']).describe('Forecast direction: long (up) or short (down)'),
    entry: z.coerce.number().describe('Entry price level'),
    targets: z.array(z.object({
      price: z.coerce.number(),
      label: z.string().optional().describe('Label for this target (e.g., "TP1 1.0470")'),
    })).describe('Array of target prices with optional labels'),
    stop_loss: z.coerce.number().optional().describe('Stop loss price level'),
    bars_forward: z.coerce.number().optional().describe('Number of bars forward to project (default 30). On 5m = 2.5h, on 1h = 30h, on D = 30 days'),
  }, async ({ direction, entry, targets, stop_loss, bars_forward }) => {
    try { return jsonResult(await core.drawForecast({ direction, entry, targets, stop_loss, bars_forward })); }
    catch (err) { return jsonResult({ success: false, error: err.message }, true); }
  });
}
