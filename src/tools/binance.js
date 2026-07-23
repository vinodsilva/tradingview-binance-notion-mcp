import { z } from 'zod';
import BinanceModule from 'binance-api-node';
const Binance = BinanceModule.default;
import { jsonResult } from './_format.js';

let binanceClient = null;

function getClient() {
  if (binanceClient) return binanceClient;
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error('BINANCE_API_KEY and BINANCE_API_SECRET must be set in environment variables');
  }
  const sandbox = process.env.BINANCE_TESTNET === 'true';
  binanceClient = Binance({
    apiKey,
    apiSecret,
    httpBase: sandbox ? 'https://testnet.binance.vision' : 'https://api.binance.com',
  });
  return binanceClient;
}

function wrapHandler(fn) {
  return async (params) => {
    try {
      const result = await fn(params);
      return jsonResult(result);
    } catch (err) { return jsonResult({ success: false, error: err.message }, true); }
  };
}

function getRiskConfig() {
  return {
    maxPositionSize: parseFloat(process.env.FUTURES_MAX_POSITION_SIZE || '1000'),
    maxRiskPerTrade: parseFloat(process.env.FUTURES_MAX_RISK_PER_TRADE || '0.01'),
    maxDailyLoss: parseFloat(process.env.FUTURES_MAX_DAILY_LOSS || '200'),
    maxOpenPositions: parseInt(process.env.FUTURES_MAX_OPEN_POSITIONS || '5'),
    minConfidence: parseFloat(process.env.FUTURES_MIN_CONFIDENCE || '0.7'),
    leverage: parseInt(process.env.FUTURES_LEVERAGE || '5'),
    marginType: process.env.FUTURES_MARGIN_TYPE || 'CROSSED',
    positionMode: process.env.FUTURES_POSITION_MODE || 'ONE_WAY',
  };
}

export function registerBinanceTools(server) {
  // ── Market Data ──────────────────────────────────────────────

  server.tool('get_price', 'Get current price for a trading pair', {
    symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
  }, wrapHandler(async ({ symbol }) => {
    const price = await getClient().prices({ symbol });
    return { symbol, price: price[symbol], timestamp: Date.now() };
  }));

  server.tool('get_orderbook', 'Get order book depth data', {
    symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
    limit: z.number().optional().default(100).describe('Depth limit, default 100'),
  }, wrapHandler(async ({ symbol, limit }) => {
    const book = await getClient().book({ symbol, limit });
    return {
      symbol, lastUpdateId: book.lastUpdateId,
      bids: book.bids.slice(0, limit).map(b => ({ price: b.price, quantity: b.quantity })),
      asks: book.asks.slice(0, limit).map(a => ({ price: a.price, quantity: a.quantity })),
      timestamp: Date.now(),
    };
  }));

  server.tool('get_klines', 'Get kline/candlestick data', {
    symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
    interval: z.enum(['1m','3m','5m','15m','30m','1h','2h','4h','6h','8h','12h','1d','3d','1w','1M']).describe('Interval'),
    limit: z.number().optional().default(500).describe('Number of candles, default 500'),
  }, wrapHandler(async ({ symbol, interval, limit }) => {
    const klines = await getClient().candles({ symbol, interval, limit });
    return {
      symbol, interval,
      data: klines.map(k => ({
        openTime: k.openTime, open: k.open, high: k.high, low: k.low,
        close: k.close, volume: k.volume, closeTime: k.closeTime,
        quoteAssetVolume: k.quoteAssetVolume, numberOfTrades: k.numberOfTrades,
        takerBuyBaseAssetVolume: k.takerBuyBaseAssetVolume, takerBuyQuoteAssetVolume: k.takerBuyQuoteAssetVolume,
      })),
      timestamp: Date.now(),
    };
  }));

  server.tool('get_24hr_ticker', 'Get 24hr price change statistics', {
    symbol: z.string().optional().describe('Trading pair symbol, omit for all'),
  }, wrapHandler(async ({ symbol }) => {
    if (symbol) {
      const ticker = await getClient().dailyStats({ symbol });
      return { symbol, data: ticker, timestamp: Date.now() };
    } else {
      const tickers = await getClient().dailyStats();
      return { data: Array.isArray(tickers) ? tickers : [tickers], timestamp: Date.now() };
    }
  }));

  // ── Account ──────────────────────────────────────────────────

  server.tool('get_account_info', 'Get account info and balances', {}, wrapHandler(async () => {
    const info = await getClient().accountInfo();
    return {
      makerCommission: info.makerCommission, takerCommission: info.takerCommission,
      buyerCommission: info.buyerCommission, sellerCommission: info.sellerCommission,
      canTrade: info.canTrade, canWithdraw: info.canWithdraw, canDeposit: info.canDeposit,
      updateTime: info.updateTime, accountType: info.accountType, permissions: info.permissions,
      balances: info.balances
        .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
        .map(b => ({ asset: b.asset, free: b.free, locked: b.locked, total: (parseFloat(b.free) + parseFloat(b.locked)).toString() })),
      timestamp: Date.now(),
    };
  }));

  server.tool('get_open_orders', 'Get current open orders', {
    symbol: z.string().optional().describe('Filter by trading pair'),
  }, wrapHandler(async ({ symbol }) => {
    const orders = await getClient().openOrders(symbol ? { symbol } : {});
    return {
      symbol: symbol || 'ALL', count: orders.length,
      orders: orders.map(o => ({
        symbol: o.symbol, orderId: o.orderId, price: o.price,
        origQty: o.origQty, executedQty: o.executedQty, status: o.status,
        type: o.type, side: o.side, time: o.time, stopPrice: o.stopPrice,
      })),
      timestamp: Date.now(),
    };
  }));

  server.tool('get_order_history', 'Get historical orders', {
    symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
    limit: z.number().optional().default(500).describe('Limit, default 500'),
  }, wrapHandler(async ({ symbol, limit }) => {
    const orders = await getClient().allOrders({ symbol, limit });
    return {
      symbol, count: orders.length,
      orders: orders.map(o => ({
        symbol: o.symbol, orderId: o.orderId, price: o.price,
        origQty: o.origQty, executedQty: o.executedQty, status: o.status,
        type: o.type, side: o.side, time: o.time, stopPrice: o.stopPrice,
      })),
      timestamp: Date.now(),
    };
  }));

  // ── Spot Trading ─────────────────────────────────────────────

  server.tool('place_order', 'Place a spot order', {
    symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
    side: z.enum(['BUY', 'SELL']).describe('Order side'),
    type: z.enum(['MARKET', 'LIMIT']).describe('Order type'),
    quantity: z.string().describe('Order quantity'),
    price: z.string().optional().describe('Price (required for LIMIT orders)'),
  }, wrapHandler(async ({ symbol, side, type, quantity, price }) => {
    const params = { symbol, side, type, quantity };
    if (type === 'LIMIT') {
      if (!price) throw new Error('Price is required for LIMIT orders');
      params.price = price;
      params.timeInForce = 'GTC';
    }
    const result = await getClient().order(params);
    return {
      symbol: result.symbol, orderId: result.orderId, price: result.price,
      origQty: result.origQty, executedQty: result.executedQty,
      cummulativeQuoteQty: result.cummulativeQuoteQty, status: result.status,
      type: result.type, side: result.side, fills: result.fills || [],
      network: process.env.BINANCE_TESTNET === 'true' ? 'testnet' : 'mainnet',
      timestamp: Date.now(),
    };
  }));

  server.tool('cancel_order', 'Cancel an order', {
    symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
    orderId: z.number().describe('Order ID'),
  }, wrapHandler(async ({ symbol, orderId }) => {
    const result = await getClient().cancelOrder({ symbol, orderId });
    return {
      symbol: result.symbol, orderId: result.orderId, price: result.price,
      origQty: result.origQty, executedQty: result.executedQty,
      status: result.status, side: result.side, timestamp: Date.now(),
    };
  }));

  server.tool('cancel_all_orders', 'Cancel all open orders for a pair', {
    symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
  }, wrapHandler(async ({ symbol }) => {
    const results = await getClient().cancelOpenOrders({ symbol });
    const orders = Array.isArray(results) ? results : [results];
    return {
      symbol, cancelledCount: orders.length,
      orders: orders.map(r => ({
        symbol: r.symbol, orderId: r.orderId, price: r.price,
        origQty: r.origQty, status: r.status, side: r.side,
      })),
      timestamp: Date.now(),
    };
  }));

  // ── Futures Account & Positions ──────────────────────────────

  server.tool('get_futures_account_info', 'Get futures account info', {}, wrapHandler(async () => {
    const info = await getClient().futuresAccountInfo();
    return {
      totalWalletBalance: info.totalWalletBalance,
      availableBalance: info.availableBalance,
      totalUnrealizedProfit: info.totalUnrealizedProfit,
      totalMarginBalance: info.totalMarginBalance,
      totalPositionInitialMargin: info.totalPositionInitialMargin,
      totalOpenOrderInitialMargin: info.totalOpenOrderInitialMargin,
    };
  }));

  server.tool('get_futures_positions', 'Get current futures positions', {}, wrapHandler(async () => {
    const account = await getClient().futuresAccountInfo();
    const positions = (account.positions || []).filter(p => parseFloat(p.positionAmt) !== 0);
    return {
      total: positions.length,
      positions: positions.map(p => ({
        symbol: p.symbol, positionAmt: p.positionAmt, entryPrice: p.entryPrice,
        markPrice: p.markPrice, unRealizedProfit: p.unRealizedProfit,
        liquidationPrice: p.liquidationPrice, leverage: p.leverage,
        marginType: p.marginType, positionSide: p.positionSide,
      })),
    };
  }));

  server.tool('get_futures_open_orders', 'Get futures open orders', {
    symbol: z.string().optional().describe('Filter by trading pair'),
  }, wrapHandler(async ({ symbol }) => {
    const params = symbol ? { symbol } : {};
    const orders = await getClient().futuresOpenOrders(params);
    return {
      total: orders.length,
      orders: orders.map(o => ({
        symbol: o.symbol, orderId: o.orderId, price: o.price,
        origQty: o.origQty, executedQty: o.executedQty, status: o.status,
        type: o.type, side: o.side, time: o.time, stopPrice: o.stopPrice,
        reduceOnly: o.reduceOnly, positionSide: o.positionSide,
      })),
    };
  }));

  server.tool('cancel_futures_orders', 'Cancel all futures orders for a symbol', {
    symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
  }, wrapHandler(async ({ symbol }) => {
    await getClient().futuresCancelAllOpenOrders({ symbol });
    return { success: true, message: `All futures orders cancelled for ${symbol}` };
  }));

  server.tool('set_futures_leverage', 'Set futures leverage', {
    symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
    leverage: z.number().int().min(1).max(125).describe('Leverage (1-125)'),
  }, wrapHandler(async ({ symbol, leverage }) => {
    const result = await getClient().futuresLeverage({ symbol, leverage });
    return { symbol, leverage: result.leverage, maxNotionalValue: result.maxNotionalValue };
  }));

  server.tool('set_futures_margin_type', 'Set futures margin type', {
    symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
    marginType: z.enum(['ISOLATED', 'CROSSED']).describe('Margin type'),
  }, wrapHandler(async ({ symbol, marginType }) => {
    await getClient().futuresMarginType({ symbol, marginType });
    return { success: true, symbol, marginType };
  }));

  // ── Futures Trading ──────────────────────────────────────────

  server.tool('place_futures_order', 'Place a futures order', {
    symbol: z.string().describe('Trading pair symbol, e.g. BTCUSDT'),
    side: z.enum(['BUY', 'SELL']).describe('Order side'),
    type: z.enum(['MARKET', 'LIMIT', 'STOP_MARKET', 'TAKE_PROFIT_MARKET']).describe('Order type'),
    quantity: z.string().describe('Order quantity'),
    price: z.string().optional().describe('Price (required for LIMIT)'),
    stopPrice: z.string().optional().describe('Stop price (required for STOP_MARKET/TAKE_PROFIT_MARKET)'),
    reduceOnly: z.boolean().optional().describe('Reduce-only order'),
    positionSide: z.enum(['LONG', 'SHORT', 'BOTH']).optional().describe('Position side'),
    timeInForce: z.enum(['GTC', 'IOC', 'FOK']).optional().describe('Time in force'),
  }, wrapHandler(async ({ symbol, side, type, quantity, price, stopPrice, reduceOnly, positionSide, timeInForce }) => {
    const params = { symbol, side, type, quantity, positionSide: positionSide || 'BOTH' };
    if (price) params.price = price;
    if (stopPrice) params.stopPrice = stopPrice;
    if (reduceOnly !== undefined) params.reduceOnly = reduceOnly;
    if (timeInForce) params.timeInForce = timeInForce;
    if (type === 'LIMIT' && !params.timeInForce) params.timeInForce = 'GTC';
    const result = await getClient().futuresOrder(params);
    return {
      symbol: result.symbol,
      orderId: result.orderId || result.algoId,
      price: result.price,
      origQty: result.origQty || result.quantity,
      executedQty: result.executedQty,
      status: result.status || result.algoStatus,
      type: result.type || result.orderType,
      side: result.side,
      positionSide: result.positionSide,
      reduceOnly: result.reduceOnly,
      stopPrice: result.stopPrice || result.triggerPrice,
      timestamp: Date.now(),
    };
  }));

  // ── Risk Config ──────────────────────────────────────────────

  server.tool('get_risk_config', 'Get current risk management configuration', {}, async () => {
    return jsonResult(getRiskConfig());
  });
}
