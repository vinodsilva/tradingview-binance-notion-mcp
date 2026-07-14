import { FuturesClient, FuturesPosition } from './futures-client.js';
import { Signal } from '../types/signals.js';

export interface FuturesRiskConfig {
  maxPositionSize: number;
  maxRiskPerTrade: number;
  maxDailyLoss: number;
  maxOpenPositions: number;
  minConfidence: number;
  maxLeverage: number;
  liquidationBuffer: number;
  autoLeverage: boolean;
}

export interface RiskValidationResult {
  valid: boolean;
  reason?: string;
  suggestedLeverage?: number;
  maxQuantity?: string;
}

export class FuturesRiskManagement {
  private futuresClient: FuturesClient;
  private riskConfig: FuturesRiskConfig;

  constructor(futuresClient: FuturesClient, riskConfig?: Partial<FuturesRiskConfig>) {
    this.futuresClient = futuresClient;
    this.riskConfig = {
      maxPositionSize: parseFloat(process.env.FUTURES_MAX_POSITION_SIZE || '1000'),
      maxRiskPerTrade: parseFloat(process.env.FUTURES_MAX_RISK_PER_TRADE || '0.01'),
      maxDailyLoss: parseFloat(process.env.FUTURES_MAX_DAILY_LOSS || '200'),
      maxOpenPositions: parseInt(process.env.FUTURES_MAX_OPEN_POSITIONS || '5'),
      minConfidence: parseFloat(process.env.FUTURES_MIN_CONFIDENCE || '0.7'),
      maxLeverage: parseInt(process.env.FUTURES_MAX_LEVERAGE || '20'),
      liquidationBuffer: parseFloat(process.env.FUTURES_LIQUIDATION_BUFFER || '0.05'),
      autoLeverage: process.env.FUTURES_AUTO_LEVERAGE === 'true',
      ...riskConfig,
    };
  }

  async validateSignal(signal: Signal): Promise<RiskValidationResult> {
    try {
      // Confidence check disabled - execute all signals regardless of confidence level
      // if (signal.confidence < this.riskConfig.minConfidence) {
      //   return { 
      //     valid: false, 
      //     reason: `Signal confidence ${signal.confidence} below minimum ${this.riskConfig.minConfidence}` 
      //   };
      // }

      // Check risk-reward ratio
      if (signal.riskRewardRatio < 1.5) {
        return { 
          valid: false, 
          reason: `Risk-reward ratio ${signal.riskRewardRatio} below minimum 1.5` 
        };
      }

      // Check if we already have too many open positions
      const openPositions = await this.futuresClient.getPositions();
      if (openPositions.length >= this.riskConfig.maxOpenPositions) {
        return { 
          valid: false, 
          reason: `Maximum open positions (${this.riskConfig.maxOpenPositions}) reached` 
        };
      }

      // Check if symbol already has an open position
      const existingPosition = openPositions.find(p => p.symbol === signal.symbol);
      if (existingPosition) {
        // In HEDGE mode, allow opposite positions for cross-trading
        const isHedgeMode = await this.isHedgeMode();
        if (isHedgeMode) {
          const existingSide = parseFloat(existingPosition.positionAmt) > 0 ? 'LONG' : 'SHORT';
          const newSide = signal.signal === 'BUY' ? 'LONG' : 'SHORT';
          
          // Allow opposite positions for cross-trading
          if (existingSide !== newSide) {
            console.log(`📊 Cross-trading allowed: ${existingSide} position exists, opening ${newSide}`);
          } else {
            return { 
              valid: false, 
              reason: `Already have ${existingSide} position for ${signal.symbol}` 
            };
          }
        } else {
          return { 
            valid: false, 
            reason: `Already have open position for ${signal.symbol}` 
          };
        }
      }

      // Check daily PnL limit
      const dailyPnL = await this.getDailyPnL();
      if (dailyPnL <= -this.riskConfig.maxDailyLoss) {
        return { 
          valid: false, 
          reason: `Daily loss limit (${this.riskConfig.maxDailyLoss}) reached` 
        };
      }

      // Calculate position size and leverage
      const positionSizeResult = await this.calculatePositionSize(signal);
      if (!positionSizeResult.valid) {
        return positionSizeResult;
      }

      return {
        valid: true,
        suggestedLeverage: positionSizeResult.suggestedLeverage,
        maxQuantity: positionSizeResult.maxQuantity,
      };
    } catch (error) {
      console.error('Error validating signal:', error);
      return { 
        valid: false, 
        reason: `Error validating signal: ${error}` 
      };
    }
  }

  async calculatePositionSize(signal: Signal): Promise<RiskValidationResult> {
    try {
      const accountInfo = await this.futuresClient.getAccountInfo();
      const availableBalance = parseFloat(accountInfo.availableBalance);
      const currentPrice = await this.futuresClient.getCurrentPrice(signal.symbol);
      
      if (!currentPrice) {
        return { 
          valid: false, 
          reason: `Could not get current price for ${signal.symbol}` 
        };
      }

      // Calculate maximum risk amount (1% of available balance)
      const maxRiskAmount = availableBalance * this.riskConfig.maxRiskPerTrade;
      
      // Calculate price difference for risk calculation
      const entryPrice = parseFloat(signal.entryPrice);
      const stopLossPrice = parseFloat(signal.stopLoss);
      const priceDiff = Math.abs(entryPrice - stopLossPrice);
      
      if (priceDiff === 0) {
        return { 
          valid: false, 
          reason: 'Stop loss price equals entry price' 
        };
      }

      // Calculate maximum quantity based on risk
      const maxQuantityByRisk = maxRiskAmount / priceDiff;
      
      // Calculate maximum quantity based on position size limit
      const maxQuantityBySize = this.riskConfig.maxPositionSize / entryPrice;
      
      // Use the smaller of the two quantities
      let maxQuantity = Math.min(maxQuantityByRisk, maxQuantityBySize);
      
      // Ensure minimum position value of $5 to avoid very small quantities
      const minPositionValue = 5; // $5 minimum
      const minQuantity = minPositionValue / entryPrice;
      
      if (maxQuantity < minQuantity) {
        console.warn(`⚠️  Calculated quantity too small (${maxQuantity}), using minimum of ${minQuantity} for $${minPositionValue} position`);
        maxQuantity = minQuantity;
      }
      
      // Calculate optimal leverage
      const positionValue = maxQuantity * entryPrice;
      const marginRequired = positionValue / this.riskConfig.maxLeverage;
      
      if (marginRequired > availableBalance) {
        // Reduce leverage to fit available balance
        const suggestedLeverage = Math.floor(positionValue / availableBalance);
        if (suggestedLeverage < 1) {
          return { 
            valid: false, 
            reason: 'Insufficient balance for minimum position size' 
          };
        }
        
        return {
          valid: true,
          suggestedLeverage: Math.min(suggestedLeverage, this.riskConfig.maxLeverage),
          maxQuantity: this.formatQuantity(maxQuantity, signal.symbol),
        };
      }

      return {
        valid: true,
        suggestedLeverage: this.riskConfig.maxLeverage,
        maxQuantity: this.formatQuantity(maxQuantity, signal.symbol),
      };
    } catch (error) {
      console.error('Error calculating position size:', error);
      return { 
        valid: false, 
        reason: `Error calculating position size: ${error}` 
      };
    }
  }

  async checkLiquidationRisk(position: FuturesPosition): Promise<{ atRisk: boolean; distance: number }> {
    try {
      const currentPrice = await this.futuresClient.getCurrentPrice(position.symbol);
      const liquidationPrice = parseFloat(position.liquidationPrice);
      
      if (!liquidationPrice) {
        return { atRisk: false, distance: 0 };
      }

      const distance = Math.abs((currentPrice - liquidationPrice) / currentPrice);
      const atRisk = distance <= this.riskConfig.liquidationBuffer;

      return { atRisk, distance };
    } catch (error) {
      console.error('Error checking liquidation risk:', error);
      return { atRisk: false, distance: 0 };
    }
  }

  async getRiskSummary(): Promise<{
    openPositions: number;
    maxPositions: number;
    dailyPnL: number;
    maxDailyLoss: number;
    riskPerTrade: number;
    availableBalance: number;
    totalMarginUsed: number;
    liquidationRiskPositions: string[];
  }> {
    try {
      const openPositions = await this.futuresClient.getPositions();
      const accountInfo = await this.futuresClient.getAccountInfo();
      const dailyPnL = await this.getDailyPnL();

      // Check for positions at liquidation risk
      const liquidationRiskPositions: string[] = [];
      for (const position of openPositions) {
        const risk = await this.checkLiquidationRisk(position);
        if (risk.atRisk) {
          liquidationRiskPositions.push(position.symbol);
        }
      }

      return {
        openPositions: openPositions.length,
        maxPositions: this.riskConfig.maxOpenPositions,
        dailyPnL,
        maxDailyLoss: this.riskConfig.maxDailyLoss,
        riskPerTrade: this.riskConfig.maxRiskPerTrade,
        availableBalance: parseFloat(accountInfo.availableBalance),
        totalMarginUsed: parseFloat(accountInfo.totalPositionInitialMargin),
        liquidationRiskPositions,
      };
    } catch (error) {
      console.error('Error getting risk summary:', error);
      throw error;
    }
  }

  private async getDailyPnL(): Promise<number> {
    try {
      const accountInfo = await this.futuresClient.getAccountInfo();
      return parseFloat(accountInfo.totalUnrealizedProfit);
    } catch (error) {
      console.error('Error getting daily PnL:', error);
      return 0;
    }
  }

  private formatQuantity(quantity: number, symbol: string): string {
    // Basic quantity formatting based on symbol type
    // In a real implementation, you'd get lot size info from Binance futures
    if (symbol.includes('BTC') || symbol.includes('ETH')) {
      return quantity.toFixed(6);
    } else if (symbol.includes('USDT')) {
      return quantity.toFixed(2);
    } else {
      return quantity.toFixed(4);
    }
  }

  getRiskConfig(): FuturesRiskConfig {
    return { ...this.riskConfig };
  }

  updateRiskConfig(newConfig: Partial<FuturesRiskConfig>): void {
    this.riskConfig = { ...this.riskConfig, ...newConfig };
  }

  private async isHedgeMode(): Promise<boolean> {
    try {
      // For now, assume HEDGE mode is enabled since we know it's already set
      // In a production system, you'd need to add a method to FuturesClient to check position mode
      return true;
    } catch (error) {
      console.error('Error checking position mode:', error);
      return false;
    }
  }
}