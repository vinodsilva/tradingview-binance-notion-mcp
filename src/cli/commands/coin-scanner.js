import { register } from '../router.js';
import * as core from '../../core/coin-scanner.js';

register('coin-stochrsi', {
  description: 'Scan coins using 3-TF StochRSI — overbought/oversold + hidden divergence',
  options: {
    symbols: { type: 'string', short: 's', description: 'Comma-separated symbols (e.g., BINANCE:BTCUSDT,BINANCE:ETHUSDT)' },
    timeframes: { type: 'string', short: 't', description: 'Comma-separated TFs (default 60,240,D)' },
    bars: { type: 'string', short: 'b', description: 'Bars per TF (default 50)' },
    volume: { type: 'string', short: 'v', description: 'Min volume in $M (default 5)' },
    top: { type: 'string', short: 'n', description: 'Top N results (default 10)' },
    file: { type: 'string', description: 'Path to file with symbols (one per line)' },
  },
  handler: async (opts) => {
    let symbols;
    if (opts.file) {
      const { readFileSync } = await import('fs');
      symbols = readFileSync(opts.file, 'utf-8').split('\n').filter(s => s.trim()).map(s => s.trim());
    } else if (opts.symbols) {
      symbols = opts.symbols.split(',').map(s => s.trim());
    } else {
      throw new Error('Symbols required. Use --symbols or --file.');
    }
    return core.scanStochRSI({
      symbols,
      timeframes: opts.timeframes ? opts.timeframes.split(',').map(s => s.trim()) : ['60', '240', 'D'],
      bars: opts.bars ? parseInt(opts.bars) : 50,
      volume_min: opts.volume ? parseFloat(opts.volume) : 5,
      top_n: opts.top ? parseInt(opts.top) : 10,
    });
  },
});

register('coin-scan', {
  description: 'Scan coins using Markov chain analysis for momentum candidates',
  options: {
    symbols: { type: 'string', short: 's', description: 'Comma-separated symbols (e.g., BINANCE:BTCUSDT,BINANCE:ETHUSDT)' },
    timeframe: { type: 'string', short: 't', description: 'Entry TF for Markov (default 60)' },
    htf: { type: 'string', description: 'Higher TF for trend context (e.g., D, 240, W). Adds alignment score.' },
    bars: { type: 'string', short: 'b', description: 'Bars for analysis (default 30)' },
    volume: { type: 'string', short: 'v', description: 'Min volume in $M (default 10)' },
    top: { type: 'string', short: 'n', description: 'Top N results (default 10)' },
    file: { type: 'string', description: 'Path to file with symbols (one per line)' },
  },
  handler: async (opts) => {
    let symbols;
    if (opts.file) {
      const { readFileSync } = await import('fs');
      symbols = readFileSync(opts.file, 'utf-8').split('\n').filter(s => s.trim()).map(s => s.trim());
    } else if (opts.symbols) {
      symbols = opts.symbols.split(',').map(s => s.trim());
    } else {
      throw new Error('Symbols required. Use --symbols or --file.');
    }
    return core.scanCoins({
      symbols,
      timeframe: opts.timeframe || '60',
      htf: opts.htf || null,
      bars: opts.bars ? parseInt(opts.bars) : 30,
      volume_min: opts.volume ? parseFloat(opts.volume) : 10,
      top_n: opts.top ? parseInt(opts.top) : 10,
    });
  },
});
