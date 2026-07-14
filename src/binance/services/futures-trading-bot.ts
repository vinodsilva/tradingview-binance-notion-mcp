import { Signal } from '../types/signals.js';
import { FuturesClient } from './futures-client.js';
import { FuturesRiskManagement, RiskValidationResult } from './futures-risk-management.js';
import { signalService } from './signal-service.js';
import { validateSymbol, validateQuantity, validatePrice, formatQuantity } from '../utils/validation.js';
import { handleBinanceError } from '../utils/error-handling.js';

export interface TradingBotConfig {
  autoStart: boolean;
  healthCheckInterval: number;
  positionCheckInterval: number;
  maxRetries: number;
  retryDelay: number;
}

export interface TradeExecutionResult {
  success: boolean;
  order?: any;
  stopLossOrder?: any;
  takeProfitOrder?: any;
  execution?: any;
  error?: string;
  riskValidation?: RiskValidationResult;
}

export class FuturesTradingBot {
  private futuresClient: FuturesClient;
  private riskManagement: FuturesRiskManagement;
  private isRunning: boolean = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private positionCheckInterval: NodeJS.Timeout | null = null;
  private config: TradingBotConfig;

  constructor(config?: Partial<TradingBotConfig>) {
    this.futuresClient = new FuturesClient();
    this.riskManagement = new FuturesRiskManagement(this.futuresClient);
    this.config = {
      autoStart: process.env.BOT_AUTO_START === 'true',
      healthCheckInterval: parseInt(process.env.BOT_HEALTH_CHECK_INTERVAL || '30000'),
      positionCheckInterval: parseInt(process.env.BOT_POSITION_CHECK_INTERVAL || '60000'),
      maxRetries: parseInt(process.env.BOT_MAX_RETRIES || '3'),
      retryDelay: parseInt(process.env.BOT_RETRY_DELAY || '5000'),
      ...config,
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('🚀 Futures trading bot is already running');
      return;
    }

    try {
      console.log('🚀 Starting futures trading bot...');
      
      // Initialize futures account settings
      await this.initializeFuturesAccount();
      
      this.isRunning = true;
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Start position monitoring
      this.startPositionMonitoring();
      
      console.log('✅ Futures trading bot started successfully');
      console.log('📊 Bot will automatically execute trades when new signals are detected');
      
    } catch (error) {
      console.error('❌ Failed to start futures trading bot:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('🛑 Futures trading bot is not running');
      return;
    }

    try {
      console.log('🛑 Stopping futures trading bot...');
      
      this.isRunning = false;
      
      // Stop monitoring intervals
      this.stopHealthMonitoring();
      this.stopPositionMonitoring();
      
      console.log('✅ Futures trading bot stopped successfully');
      
    } catch (error) {
      console.error('❌ Failed to stop futures trading bot:', error);
      throw error;
    }
  }

  async executeSignalTrade(signal: Signal): Promise<TradeExecutionResult> {
    try {
      console.log(`🎯 Processing signal for ${signal.symbol}: ${signal.signal} @ ${signal.entryPrice}`);
      
      // First check if symbol exists on Binance Futures
      try {
        await this.futuresClient.getCurrentPrice(signal.symbol);
      } catch (error) {
        console.warn(`⚠️ Signal rejected: Symbol ${signal.symbol} not found on Binance Futures`);
        return {
          success: false,
          error: `Symbol ${signal.symbol} not found on Binance Futures`,
        };
      }
      
      // Validate signal with risk management
      const riskValidation = await this.riskManagement.validateSignal(signal);
      if (!riskValidation.valid) {
        console.warn(`⚠️ Signal rejected: ${riskValidation.reason}`);
        return {
          success: false,
          error: riskValidation.reason,
          riskValidation,
        };
      }

      // Get current price for validation
      const currentPrice = await this.futuresClient.getCurrentPrice(signal.symbol);
      if (!currentPrice) {
        return {
          success: false,
          error: `Could not get current price for ${signal.symbol}`,
        };
      }

      // Validate inputs
      validateSymbol(signal.symbol);
      validateQuantity(riskValidation.maxQuantity!);
      validatePrice(signal.entryPrice);
      
      // Format quantity according to symbol precision
      const formattedQuantity = formatQuantity(parseFloat(riskValidation.maxQuantity!), signal.symbol);

      // Set up futures account for the symbol
      await this.setupSymbolAccount(signal.symbol, riskValidation.suggestedLeverage!);

      // Execute the trade
      const executionResult = await this.executeTrade(signal, riskValidation);

      if (executionResult.success) {
        console.log(`✅ Successfully executed trade for ${signal.symbol}`);
      } else {
        console.error(`❌ Failed to execute trade for ${signal.symbol}: ${executionResult.error}`);
      }

      return executionResult;

    } catch (error) {
      console.error(`❌ Error executing trade for ${signal.symbol}:`, error);
      
      // Save failed execution
      await this.saveFailedExecution(signal, error);
      
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
      signal => signal.confidence >= this.riskManagement.getRiskConfig().minConfidence
    );

    const results = [];
    let executedTrades = 0;
    let failedTrades = 0;

    for (const signal of highConfidenceSignals) {
      const result = await this.executeSignalTrade(signal);
      
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
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return {
      totalSignals: highConfidenceSignals.length,
      executedTrades,
      failedTrades,
      results,
    };
  }

  private async initializeFuturesAccount(): Promise<void> {
    try {
      const config = this.futuresClient.getConfig();
      
      // Set position mode (ONE_WAY or HEDGE)
      // Note: This requires specific API calls that might not be available in the current library
      console.log(`📋 Futures account initialized with ${config.positionMode} position mode`);
      
      // Get account info to verify connection
      const accountInfo = await this.futuresClient.getAccountInfo();
      console.log(`💰 Available balance: ${accountInfo.availableBalance} USDT`);
      
    } catch (error) {
      console.error('Failed to initialize futures account:', error);
      throw error;
    }
  }

  private async setupSymbolAccount(symbol: string, leverage: number): Promise<void> {
    try {
      const config = this.futuresClient.getConfig();
      
      // Try to set leverage with multiple fallbacks
      let finalLeverage = leverage;
      const leverageOptions = [leverage, 10, 5, 3, 1]; // Try different leverage levels
      
      for (const leverageOption of leverageOptions) {
        try {
          await this.futuresClient.setLeverage(symbol, leverageOption);
          console.log(`✅ Set leverage for ${symbol} to ${leverageOption}x`);
          finalLeverage = leverageOption;
          break;
        } catch (leverageError: any) {
          if (leverageError.code === -4028) { // Invalid leverage
            console.warn(`⚠️  Leverage ${leverageOption}x not available for ${symbol}`);
            if (leverageOption === 1) {
              console.warn(`⚠️  Could not set any leverage for ${symbol}, proceeding with default`);
            }
          } else {
            console.warn(`⚠️  Leverage setup failed for ${symbol}:`, leverageError.message);
            break;
          }
        }
      }
      
      // Try to set margin type
      try {
        await this.futuresClient.setMarginType(symbol, config.marginType);
        console.log(`✅ Set margin type for ${symbol} to ${config.marginType}`);
      } catch (marginError: any) {
        // If margin type is already set, ignore the error
        if (marginError.code === -4046) { // No need to change margin type
          console.log(`ℹ️  Margin type for ${symbol} is already ${config.marginType}`);
        } else {
          console.warn(`⚠️  Margin type setup failed for ${symbol}:`, marginError.message);
        }
      }
      
    } catch (error) {
      console.warn(`⚠️  Symbol account setup had issues for ${symbol}, but proceeding:`, error);
      // Don't throw error - allow trading to continue
    }
  }

  private async executeTrade(signal: Signal, riskValidation: RiskValidationResult): Promise<TradeExecutionResult> {
    try {
      // Format quantity according to symbol precision
      const formattedQuantity = formatQuantity(parseFloat(riskValidation.maxQuantity!), signal.symbol);
      
      // Determine position side for HEDGE mode
      const positionSide = signal.signal === 'BUY' ? 'LONG' : 'SHORT';
      
      // Place limit order
      const orderResult = await this.futuresClient.placeLimitOrder({
        symbol: signal.symbol,
        side: signal.signal,
        quantity: formattedQuantity,
        price: signal.entryPrice,
        timeInForce: 'GTC',
        positionSide: positionSide,
      });

      // Place stop loss order
      const stopLossOrder = await this.futuresClient.placeStopLossOrder({
        symbol: signal.symbol,
        side: signal.signal === 'BUY' ? 'SELL' : 'BUY',
        quantity: formattedQuantity,
        stopPrice: signal.stopLoss,
        positionSide: positionSide,
      });

      // Place take profit order
      const takeProfitOrder = await this.futuresClient.placeTakeProfitOrder({
        symbol: signal.symbol,
        side: signal.signal === 'BUY' ? 'SELL' : 'BUY',
        quantity: formattedQuantity,
        stopPrice: signal.takeProfit,
        positionSide: positionSide,
      });

      // Save execution record
      const execution = await this.saveExecution(signal, riskValidation, orderResult);

      return {
        success: true,
        order: orderResult,
        stopLossOrder,
        takeProfitOrder,
        execution,
        riskValidation,
      };

    } catch (error) {
      console.error(`Failed to execute trade for ${signal.symbol}:`, error);
      
      // Cancel any open orders if the trade failed
      try {
        await this.futuresClient.cancelAllOpenOrders(signal.symbol);
      } catch (cancelError) {
        console.error(`Failed to cancel orders for ${signal.symbol}:`, cancelError);
      }
      
      throw error;
    }
  }

  private async saveExecution(
    signal: Signal, 
    riskValidation: RiskValidationResult, 
    _order: any
  ): Promise<any> {
    const execution = {
      symbol: signal.symbol,
      side: signal.signal,
      type: 'LIMIT' as const,
      quantity: riskValidation.maxQuantity!,
      price: signal.entryPrice,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      signalId: `${signal.symbol}_${signal.timestamp.getTime()}`,
      timestamp: new Date(),
      status: 'EXECUTED' as const,
    };

    return await signalService.saveExecution(execution);
  }

  private async saveFailedExecution(signal: Signal, _error: any): Promise<void> {
    try {
      const failedExecution = {
        symbol: signal.symbol,
        side: signal.signal,
        type: 'LIMIT' as const,
        quantity: '0',
        price: signal.entryPrice,
        stopLoss: signal.stopLoss,
        takeProfit: signal.takeProfit,
        signalId: `${signal.symbol}_${signal.timestamp.getTime()}`,
        timestamp: new Date(),
        status: 'FAILED' as const,
      };
      
      await signalService.saveExecution(failedExecution);
    } catch (saveError) {
      console.error('Failed to save failed execution:', saveError);
    }
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, this.config.healthCheckInterval);
  }

  private stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  private startPositionMonitoring(): void {
    this.positionCheckInterval = setInterval(async () => {
      try {
        await this.monitorPositions();
      } catch (error) {
        console.error('Position monitoring failed:', error);
      }
    }, this.config.positionCheckInterval);
  }

  private stopPositionMonitoring(): void {
    if (this.positionCheckInterval) {
      clearInterval(this.positionCheckInterval);
      this.positionCheckInterval = null;
    }
  }

  private async performHealthCheck(): Promise<void> {
    try {
      // Check account connectivity
      await this.futuresClient.getAccountInfo();
      
      // Check risk summary
      const riskSummary = await this.riskManagement.getRiskSummary();
      
      console.log('❤️  Health check passed:', {
        availableBalance: riskSummary.availableBalance,
        openPositions: riskSummary.openPositions,
        dailyPnL: riskSummary.dailyPnL,
        liquidationRiskPositions: riskSummary.liquidationRiskPositions.length,
      });
      
    } catch (error) {
      console.error('💔 Health check failed:', error);
      throw error;
    }
  }

  private async monitorPositions(): Promise<void> {
    try {
      const positions = await this.futuresClient.getPositions();
      
      for (const position of positions) {
        const risk = await this.riskManagement.checkLiquidationRisk(position);
        
        if (risk.atRisk) {
          console.warn(`🚨 LIQUIDATION RISK: ${position.symbol} is ${(risk.distance * 100).toFixed(2)}% from liquidation!`);
          
          // In a production system, you might want to take action here
          // such as reducing position size or closing the position
        }
      }
      
    } catch (error) {
      console.error('Failed to monitor positions:', error);
    }
  }

  isBotRunning(): boolean {
    return this.isRunning;
  }

  getBotConfig(): TradingBotConfig {
    return { ...this.config };
  }

  async testTradeWithFixedValue(symbol: string, side: 'BUY' | 'SELL', entryPrice: string, stopLoss: string, takeProfit: string): Promise<TradeExecutionResult> {
    try {
      console.log(`🧪 Testing trade execution for ${symbol}: ${side} @ ${entryPrice} with 5 USD value`);
      
      // First check if symbol exists on Binance Futures
      try {
        await this.futuresClient.getCurrentPrice(symbol);
      } catch (error) {
        console.warn(`⚠️ Test trade rejected: Symbol ${symbol} not found on Binance Futures`);
        return {
          success: false,
          error: `Symbol ${symbol} not found on Binance Futures`,
        };
      }

      // Get current price for validation
      const currentPrice = await this.futuresClient.getCurrentPrice(symbol);
      if (!currentPrice) {
        return {
          success: false,
          error: `Could not get current price for ${symbol}`,
        };
      }

      // Calculate quantity for 5 USD value
      const rawQuantity = 5 / parseFloat(entryPrice);
      const quantity = formatQuantity(rawQuantity, symbol);
      
      console.log(`📊 Calculated quantity for 5 USD: ${quantity} ${symbol}`);

      // Set up futures account for the symbol
      await this.setupSymbolAccount(symbol, 5); // Use 5x leverage for test

      // Determine position side for HEDGE mode
      const positionSide = side === 'BUY' ? 'LONG' : 'SHORT';

      // Place limit order with fixed 5 USD value
      const orderResult = await this.futuresClient.placeLimitOrder({
        symbol,
        side,
        quantity,
        price: entryPrice,
        timeInForce: 'GTC',
        positionSide: positionSide,
      });

      console.log(`✅ Test trade order placed successfully for ${symbol}: ${side} ${quantity} @ ${entryPrice}`);

      // Place stop loss order
      const stopLossOrder = await this.futuresClient.placeStopLossOrder({
        symbol,
        side: side === 'BUY' ? 'SELL' : 'BUY',
        quantity,
        stopPrice: stopLoss,
        positionSide: positionSide,
      });

      console.log(`✅ Stop loss order placed for ${symbol}: ${stopLoss}`);

      // Place take profit order
      const takeProfitOrder = await this.futuresClient.placeTakeProfitOrder({
        symbol,
        side: side === 'BUY' ? 'SELL' : 'BUY',
        quantity,
        stopPrice: takeProfit,
        positionSide: positionSide,
      });

      console.log(`✅ Take profit order placed for ${symbol}: ${takeProfit}`);

      return {
        success: true,
        order: orderResult,
        stopLossOrder,
        takeProfitOrder,
        execution: {
          symbol,
          side,
          type: 'LIMIT' as const,
          quantity,
          price: entryPrice,
          stopLoss,
          takeProfit,
          signalId: `test_${symbol}_${Date.now()}`,
          timestamp: new Date(),
          status: 'EXECUTED' as const,
        },
      };

    } catch (error) {
      console.error(`❌ Test trade execution failed for ${symbol}:`, error);
      
      return {
        success: false,
        error: `Test trade failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}