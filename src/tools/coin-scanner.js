import { z } from 'zod';
import { jsonResult } from './_format.js';
import * as core from '../core/coin-scanner.js';

export function registerCoinScannerTools(server) {
  server.tool('coin_scan', 'Scan coins using Markov chain analysis to find momentum candidates', {
    symbols: z.array(z.string()).describe('Array of symbols to scan (e.g., ["BINANCE:BTCUSDT", "BINANCE:ETHUSDT"])'),
    timeframe: z.string().optional().default('60').describe('Entry timeframe for Markov analysis (default 60)'),
    htf: z.string().optional().describe('Higher timeframe for trend context (e.g., "D", "240"). Adds alignment bonus/penalty.'),
    bars: z.coerce.number().optional().default(30).describe('Number of bars for Markov matrix (default 30)'),
    volume_min: z.coerce.number().optional().default(10).describe('Minimum avg volume in USD millions (default 10)'),
    top_n: z.coerce.number().optional().default(10).describe('Return top N results (default 10)'),
  }, async ({ symbols, timeframe, htf, bars, volume_min, top_n }) => {
    try {
      const result = await core.scanCoins({ symbols, timeframe, bars, volume_min, top_n, htf: htf || null });
      return jsonResult(result);
    } catch (err) {
      return jsonResult({ success: false, error: err.message }, true);
    }
  });
}
