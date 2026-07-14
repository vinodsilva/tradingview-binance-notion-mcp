import { marketDataTools } from './market-data.js';
import { accountTools } from './account.js';
import { tradingTools } from './trading.js';
import { signalTradingTools } from './signal-trading.js';
import { futuresTradingTools } from './futures-trading.js';

export { marketDataTools, accountTools, tradingTools, signalTradingTools, futuresTradingTools };

export const getAllTools = () => {
  return [
    ...marketDataTools,
    ...accountTools,
    ...tradingTools,
    ...signalTradingTools,
    ...futuresTradingTools,
  ];
};