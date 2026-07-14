import { Signal, TradeExecution } from '../types/signals.js';
import { signalService } from './signal-service.js';
import { riskManagementService } from './risk-management.js';
import { validateSymbol, validateQuantity, validatePrice } from '../utils/validation.js';
import { handleBinanceError } from '../utils/error-handling.js';
import { isTestnetEnabled, getNetworkMode } from '../config/binance.js';

export class TradeExecutor {
  constructor(private binanceClient: any) {}

  async executeSignalBasedTrade(signal: Signal): Promise<{
    success: boolean;
    order?: any;
    execution?: TradeExecution;
    stopLossOrder?: any;
    takeProfitOrder?: any;
    error?: string;
  }> {
    try {
      // Validate signal with risk management
      const riskValidation = await riskManagementService.validateSignal(signal);
      if (!riskValidation.valid) {
        return {
          success: false,
          error: riskValidation.reason,
        };
      }

      // First check if symbol exists on Binance
      try {
        await this.getCurrentPrice(signal.symbol);
      } catch (error) {
        return {
          success: false,
          error: `Symbol ${signal.symbol} not found on Binance`,
        };
      }

      // Get current price for position sizing
      const currentPrice = await this.getCurrentPrice(signal.symbol);
      if (!currentPrice) {
        return {
          success: false,
          error: `Could not get current price for ${signal.symbol}`,
        };
      }

      // Get account balance for position sizing
      const accountBalance = await this.getAccountBalance();

      // Calculate position size
      const { quantity, riskAmount } = riskManagementService.calculatePositionSize(
        signal,
        accountBalance,
        currentPrice
      );

      // Validate inputs
      validateSymbol(signal.symbol);
      validateQuantity(quantity);
      validatePrice(signal.entryPrice);

      // Create execution record
      const execution: Omit<TradeExecution, '_id'> = {
        symbol: signal.symbol,
        side: signal.signal,
        type: 'LIMIT',
        quantity,
        price: signal.entryPrice,
        stopLoss: signal.stopLoss,
        takeProfit: signal.takeProfit,
        signalId: `${signal.symbol}_${signal.timestamp.getTime()}`,
        timestamp: new Date(),
        status: 'PENDING',
      };

      const executionId = await signalService.saveExecution(execution);

      // Execute limit order
      const networkMode = getNetworkMode();
      if (networkMode === 'mainnet') {
        console.warn('⚠️  WARNING: Executing trade on MAINNET with REAL money!');
      }

      const orderParams = {
        symbol: signal.symbol,
        side: signal.signal,
        type: 'LIMIT',
        quantity,
        price: signal.entryPrice,
        timeInForce: 'GTC',
      };

      const orderResult = await this.binanceClient.order(orderParams);

      // Place stop loss order
      const stopLossOrderResult = await this.placeStopLossOrder(
        signal.symbol,
        signal.signal === 'BUY' ? 'SELL' : 'BUY',
        quantity,
        signal.stopLoss
      );

      // Place take profit order
      const takeProfitOrderResult = await this.placeTakeProfitOrder(
        signal.symbol,
        signal.signal === 'BUY' ? 'SELL' : 'BUY',
        quantity,
        signal.takeProfit
      );

      // Update execution status and add order IDs
      await signalService.updateExecutionWithOrderIds(
        executionId,
        'EXECUTED',
        orderResult.orderId?.toString(),
        stopLossOrderResult.orderId?.toString(),
        takeProfitOrderResult.orderId?.toString()
      );

      return {
        success: true,
        order: orderResult,
        stopLossOrder: stopLossOrderResult,
        takeProfitOrder: takeProfitOrderResult,
        execution: {
          ...execution,
          _id: executionId,
          entryOrderId: orderResult.orderId?.toString(),
          stopLossOrderId: stopLossOrderResult.orderId?.toString(),
          takeProfitOrderId: takeProfitOrderResult.orderId?.toString(),
        } as TradeExecution,
      };

    } catch (error) {
      console.error('Trade execution failed:', error);
      
      // Save failed execution
      if (signal) {
        try {
          const failedExecution: Omit<TradeExecution, '_id'> = {
            symbol: signal.symbol,
            side: signal.signal,
            type: 'LIMIT',
            quantity: '0',
            price: signal.entryPrice,
            stopLoss: signal.stopLoss,
            takeProfit: signal.takeProfit,
            signalId: `${signal.symbol}_${signal.timestamp.getTime()}`,
            timestamp: new Date(),
            status: 'FAILED',
          };
          await signalService.saveExecution(failedExecution);
        } catch (saveError) {
          console.error('Failed to save failed execution:', saveError);
        }
      }

      return {
        success: false,
        error: handleBinanceError(error),
      };
    }
  }

  async executeTodaySignals(): Promise<{
    totalSignals: number;
    executedTrades: number;
    failedTrades: number;
    results: Array<{
      symbol: string;
      side: string;
      success: boolean;
      orderId?: number;
      error?: string;
    }>;
  }> {
    const todaySignals = await signalService.getTodaySignals();
    const highConfidenceSignals = todaySignals.filter(
      signal => signal.confidence >= riskManagementService.getRiskConfig().minConfidence
    );

    const results = [];
    let executedTrades = 0;
    let failedTrades = 0;

    for (const signal of highConfidenceSignals) {
      const result = await this.executeSignalBasedTrade(signal);
      
      results.push({
        symbol: signal.symbol,
        side: signal.signal,
        success: result.success,
        orderId: result.order?.orderId,
        error: result.error,
      });

      if (result.success) {
        executedTrades++;
      } else {
        failedTrades++;
      }

      // Small delay between trades to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return {
      totalSignals: highConfidenceSignals.length,
      executedTrades,
      failedTrades,
      results,
    };
  }

  private async getCurrentPrice(symbol: string): Promise<number | null> {
    try {
      // Try spot price first
      try {
        const ticker = await this.binanceClient.prices({ symbol });
        return parseFloat(ticker[symbol]);
      } catch (spotError) {
        // If spot fails, try futures price
        console.log(`Spot price failed for ${symbol}, trying futures...`);
        const futuresTicker = await this.binanceClient.futuresPrices({ symbol });
        return parseFloat(futuresTicker[symbol]);
      }
    } catch (error) {
      console.error(`Failed to get price for ${symbol}:`, error);
      return null;
    }
  }

  private async getAccountBalance(): Promise<number> {
    try {
      const accountInfo = await this.binanceClient.accountInfo();
      const usdtBalance = accountInfo.balances.find(
        (balance: any) => balance.asset === 'USDT'
      );
      return parseFloat(usdtBalance?.free || '1000'); // Default to 1000 USDT if not found
    } catch (error) {
      console.error('Failed to get account balance:', error);
      return 1000; // Default balance for safety
    }
  }

  private async placeStopLossOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: string,
    stopPrice: string
  ): Promise<any> {
    try {
      const stopLossParams = {
        symbol,
        side,
        type: 'STOP_LOSS_LIMIT',
        quantity,
        price: stopPrice,
        stopPrice,
        timeInForce: 'GTC',
      };

      return await this.binanceClient.order(stopLossParams);
    } catch (error) {
      console.error('Failed to place stop loss order:', error);
      // If STOP_LOSS_LIMIT fails, try with LIMIT order
      const fallbackParams = {
        symbol,
        side,
        type: 'LIMIT',
        quantity,
        price: stopPrice,
        timeInForce: 'GTC',
      };
      return await this.binanceClient.order(fallbackParams);
    }
  }

  private async placeTakeProfitOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: string,
    takeProfitPrice: string
  ): Promise<any> {
    try {
      const takeProfitParams = {
        symbol,
        side,
        type: 'TAKE_PROFIT_LIMIT',
        quantity,
        price: takeProfitPrice,
        stopPrice: takeProfitPrice,
        timeInForce: 'GTC',
      };

      return await this.binanceClient.order(takeProfitParams);
    } catch (error) {
      console.error('Failed to place take profit order:', error);
      // If TAKE_PROFIT_LIMIT fails, try with LIMIT order
      const fallbackParams = {
        symbol,
        side,
        type: 'LIMIT',
        quantity,
        price: takeProfitPrice,
        timeInForce: 'GTC',
      };
      return await this.binanceClient.order(fallbackParams);
    }
  }
}