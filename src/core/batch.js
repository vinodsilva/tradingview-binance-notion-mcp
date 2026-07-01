import { evaluate, evaluateAsync, getClient, getChartApi, getChartCollection, safeString } from '../connection.js';
import { waitForChartReady } from '../wait.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = join(dirname(dirname(__dirname)), 'screenshots');

const API = 'window.TradingViewApi._activeChartWidgetWV.value()';

export async function batchRun({ symbols, timeframes, action, delay_ms, ohlcv_count }) {
  const tfs = timeframes && timeframes.length > 0 ? timeframes : [null];
  const delay = delay_ms || 2000;
  const results = [];

  for (const symbol of symbols) {
    for (const tf of tfs) {
      const combo = { symbol, timeframe: tf };
      try {
        await evaluateAsync(`new Promise(function(r){ ${API}.setSymbol(${safeString(symbol)}, {}); setTimeout(r, 1000); })`);

        await waitForChartReady(symbol);

        if (tf) {
          await evaluate(`${API}.setResolution(${safeString(tf)}, {})`);
          await new Promise(r => setTimeout(r, 500));
        }

        const waitMs = action === 'get_ohlcv' ? Math.min(delay, 500) : delay;
        await new Promise(r => setTimeout(r, waitMs));

        let actionResult;
        if (action === 'screenshot') {
          mkdirSync(SCREENSHOT_DIR, { recursive: true });
          const client = await getClient();
          const { data } = await client.Page.captureScreenshot({ format: 'png' });
          const ts = new Date().toISOString().replace(/[:.]/g, '-');
          const fname = `batch_${symbol}_${tf || 'default'}_${ts}`.replace(/[/\\]/g, '_') + '.png';
          const filePath = join(SCREENSHOT_DIR, fname);
          writeFileSync(filePath, Buffer.from(data, 'base64'));
          actionResult = { file_path: filePath };
        } else if (action === 'get_ohlcv') {
          const limit = Math.min(ohlcv_count || 20, 500);
          actionResult = await evaluate(`
            (function() {
              var chart = ${API};
              var bars = chart._chartWidget.model().mainSeries().bars();
              var count = bars.count();
              var result = [];
              var start = Math.max(0, count - ${limit});
              for (var i = start; i < count; i++) {
                var bar = bars.valueAt(i);
                if (bar) result.push({ time: bar[0], open: bar[1], high: bar[2], low: bar[3], close: bar[4], volume: bar[5] });
              }
              var closes = result.map(function(b){ return b.close; });
              var volumes = result.map(function(b){ return b.volume; });
              var avgVol = volumes.reduce(function(a,b){ return a+b; },0) / (volumes.length||1);
              var maxH = Math.max.apply(null, result.map(function(b){ return b.high; }));
              var minL = Math.min.apply(null, result.map(function(b){ return b.low; }));
              var firstC = result.length > 0 ? result[0].close : 0;
              var lastC = result.length > 0 ? result[result.length-1].close : 0;
              var rangePct = lastC > 0 ? ((maxH - minL) / lastC) * 100 : 0;
              var changePct = firstC > 0 ? ((lastC - firstC) / firstC) * 100 : 0;
              return {
                bar_count: result.length,
                avg_volume: avgVol,
                range_pct: rangePct,
                change_pct: changePct,
                last_close: lastC,
                high: maxH,
                low: minL
              };
            })()
          `);
        } else if (action === 'get_strategy_results') {
          await new Promise(r => setTimeout(r, 1000));
          actionResult = await evaluate(`
            (function() {
              var metrics = {};
              var panel = document.querySelector('[data-name="backtesting"]') || document.querySelector('[class*="strategyReport"]');
              if (!panel) return { error: 'Strategy Tester not found' };
              var items = panel.querySelectorAll('[class*="reportItem"], [class*="metric"]');
              items.forEach(function(item) {
                var label = item.querySelector('[class*="label"]');
                var value = item.querySelector('[class*="value"]');
                if (label && value) metrics[label.textContent.trim()] = value.textContent.trim();
              });
              return { metric_count: Object.keys(metrics).length, metrics: metrics };
            })()
          `);
        } else {
          actionResult = { error: 'Unknown action: ' + action };
        }
        results.push({ ...combo, success: true, result: actionResult });
      } catch (err) {
        results.push({ ...combo, success: false, error: err.message });
      }
    }
  }

  const successCount = results.filter(r => r.success).length;
  return { success: true, total_iterations: results.length, successful: successCount, failed: results.length - successCount, results };
}
