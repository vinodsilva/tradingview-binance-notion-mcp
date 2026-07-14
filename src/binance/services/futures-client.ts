import Binance from 'binance-api-node';
import { FuturesConfig, getFuturesConfig, getFuturesBaseUrl } from '../config/futures.js';

export interface FuturesPosition {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unRealizedProfit: string;
  liquidationPrice: string;
  leverage: string;
  marginType: string;
  isolatedMargin: string;
  positionSide: string;
  updateTime: number;
}

export interface FuturesAccountInfo {
  totalWalletBalance: string;
  totalUnrealizedProfit: string;
  totalMarginBalance: string;
  totalPositionInitialMargin: string;
  totalOpenOrderInitialMargin: string;
  totalCrossWalletBalance: string;
  availableBalance: string;
  maxWithdrawAmount: string;
  assets: Array<{
    asset: string;
    walletBalance: string;
    unrealizedProfit: string;
    marginBalance: string;
    maintMargin: string;
    initialMargin: string;
    positionInitialMargin: string;
    openOrderInitialMargin: string;
    crossWalletBalance: string;
    crossUnPnl: string;
    availableBalance: string;
    maxWithdrawAmount: string;
  }>;
  positions: FuturesPosition[];
}

export class FuturesClient {
  private client: any;
  private config: FuturesConfig;

  constructor() {
    this.config = getFuturesConfig();
    this.client = Binance({
      apiKey: this.config.apiKey,
      apiSecret: this.config.apiSecret,
      httpBase: getFuturesBaseUrl(this.config.testnet),
    });
  }

  async getAccountInfo(): Promise<FuturesAccountInfo> {
    try {
      const account = await this.client.futuresAccountInfo();
      return account;
    } catch (error) {
      console.error('Failed to get futures account info:', error);
      throw error;
    }
  }

  async getPositions(): Promise<FuturesPosition[]> {
    try {
      const account = await this.getAccountInfo();
      return account.positions.filter((p: any) => parseFloat(p.positionAmt) !== 0);
    } catch (error) {
      console.error('Failed to get futures positions:', error);
      throw error;
    }
  }

  async getPosition(symbol: string): Promise<FuturesPosition | null> {
    try {
      const positions = await this.getPositions();
      return positions.find(p => p.symbol === symbol) || null;
    } catch (error) {
      console.error(`Failed to get position for ${symbol}:`, error);
      throw error;
    }
  }

  async setLeverage(symbol: string, leverage: number): Promise<void> {
    try {
      await this.client.futuresLeverage({
        symbol,
        leverage,
      });
      console.log(`✅ Set leverage for ${symbol} to ${leverage}x`);
    } catch (error) {
      console.error(`Failed to set leverage for ${symbol}:`, error);
      throw error;
    }
  }

  async setMarginType(symbol: string, marginType: 'ISOLATED' | 'CROSSED'): Promise<void> {
    try {
      await this.client.futuresMarginType({
        symbol,
        marginType,
      });
      console.log(`✅ Set margin type for ${symbol} to ${marginType}`);
    } catch (error) {
      console.error(`Failed to set margin type for ${symbol}:`, error);
      throw error;
    }
  }

  async placeLimitOrder(params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: string;
    price: string;
    timeInForce?: 'GTC' | 'IOC' | 'FOK';
    reduceOnly?: boolean;
    closePosition?: boolean;
    positionSide?: 'LONG' | 'SHORT';
  }): Promise<any> {
    try {
      const orderParams: any = {
        symbol: params.symbol,
        side: params.side,
        type: 'LIMIT',
        quantity: params.quantity,
        price: params.price,
        timeInForce: params.timeInForce || 'GTC',
        positionSide: params.positionSide || 'BOTH',
      };

      // Only include reduceOnly and closePosition if explicitly provided
      // These parameters are only for closing positions, not for opening new positions
      if (params.reduceOnly !== undefined) {
        orderParams.reduceOnly = params.reduceOnly;
      }
      if (params.closePosition !== undefined) {
        orderParams.closePosition = params.closePosition;
      }

      const result = await this.client.futuresOrder(orderParams);
      console.log(`✅ Placed futures limit order for ${params.symbol}: ${params.side} ${params.quantity} @ ${params.price}`);
      return result;
    } catch (error) {
      console.error(`Failed to place futures limit order for ${params.symbol}:`, error);
      throw error;
    }
  }

  async placeStopLossOrder(params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: string;
    stopPrice: string;
    closePosition?: boolean;
    positionSide?: 'LONG' | 'SHORT';
  }): Promise<any> {
    try {
      const orderParams: any = {
        symbol: params.symbol,
        side: params.side,
        type: 'STOP_MARKET',
        quantity: params.quantity,
        stopPrice: params.stopPrice,
        positionSide: params.positionSide || 'BOTH',
      };

      // For stop loss orders, use reduceOnly and closePosition to ensure they only close positions
      orderParams.reduceOnly = true;
      orderParams.closePosition = params.closePosition !== undefined ? params.closePosition : true;

      const result = await this.client.futuresOrder(orderParams);
      console.log(`✅ Placed stop loss order for ${params.symbol}: ${params.side} ${params.quantity} @ ${params.stopPrice}`);
      return result;
    } catch (error) {
      console.error(`Failed to place stop loss order for ${params.symbol}:`, error);
      throw error;
    }
  }

  async placeTakeProfitOrder(params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: string;
    stopPrice: string;
    closePosition?: boolean;
    positionSide?: 'LONG' | 'SHORT';
  }): Promise<any> {
    try {
      const orderParams: any = {
        symbol: params.symbol,
        side: params.side,
        type: 'TAKE_PROFIT_MARKET',
        quantity: params.quantity,
        stopPrice: params.stopPrice,
        positionSide: params.positionSide || 'BOTH',
      };

      // For take profit orders, use reduceOnly and closePosition to ensure they only close positions
      orderParams.reduceOnly = true;
      orderParams.closePosition = params.closePosition !== undefined ? params.closePosition : true;

      const result = await this.client.futuresOrder(orderParams);
      console.log(`✅ Placed take profit order for ${params.symbol}: ${params.side} ${params.quantity} @ ${params.stopPrice}`);
      return result;
    } catch (error) {
      console.error(`Failed to place take profit order for ${params.symbol}:`, error);
      throw error;
    }
  }

  async cancelAllOpenOrders(symbol: string): Promise<void> {
    try {
      await this.client.futuresCancelAllOpenOrders({ symbol });
      console.log(`✅ Cancelled all open orders for ${symbol}`);
    } catch (error) {
      console.error(`Failed to cancel all open orders for ${symbol}:`, error);
      throw error;
    }
  }

  async getOpenOrders(symbol?: string): Promise<any[]> {
    try {
      const params = symbol ? { symbol } : {};
      return await this.client.futuresOpenOrders(params);
    } catch (error) {
      console.error('Failed to get open orders:', error);
      throw error;
    }
  }

  async getSymbolInfo(symbol: string): Promise<any> {
    try {
      const exchangeInfo = await this.client.futuresExchangeInfo();
      return exchangeInfo.symbols.find((s: any) => s.symbol === symbol);
    } catch (error) {
      console.error(`Failed to get symbol info for ${symbol}:`, error);
      throw error;
    }
  }

  async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const ticker = await this.client.futuresPrices({ symbol });
      return parseFloat(ticker[symbol]);
    } catch (error) {
      console.error(`Failed to get current price for ${symbol}:`, error);
      throw error;
    }
  }

  async getLiquidationPrice(symbol: string, side: 'LONG' | 'SHORT', entryPrice: number, leverage: number): Promise<number> {
    try {
      if (side === 'LONG') {
        return entryPrice * (1 - 1 / leverage);
      } else {
        return entryPrice * (1 + 1 / leverage);
      }
    } catch (error) {
      console.error(`Failed to calculate liquidation price for ${symbol}:`, error);
      throw error;
    }
  }

  getConfig(): FuturesConfig {
    return { ...this.config };
  }
}