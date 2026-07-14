import { RiskManagement, Signal } from '../types/signals.js';
import { signalService } from './signal-service.js';

export class RiskManagementService {
  private riskConfig: RiskManagement;

  constructor(riskConfig?: Partial<RiskManagement>) {
    this.riskConfig = {
      maxPositionSize: parseFloat(process.env.MAX_POSITION_SIZE || '1000'),
      maxRiskPerTrade: parseFloat(process.env.MAX_RISK_PER_TRADE || '0.01'), // Default to 1% risk
      maxDailyLoss: parseFloat(process.env.MAX_DAILY_LOSS || '200'),
      maxOpenPositions: parseInt(process.env.MAX_OPEN_POSITIONS || '5'),
      minConfidence: parseFloat(process.env.MIN_CONFIDENCE || '0.7'),
      ...riskConfig,
    };
  }

  async validateSignal(signal: Signal): Promise<{ valid: boolean; reason?: string }> {
    // Check confidence level
    if (signal.confidence < this.riskConfig.minConfidence) {
      return { 
        valid: false, 
        reason: `Signal confidence ${signal.confidence} below minimum ${this.riskConfig.minConfidence}` 
      };
    }

    // Check risk-reward ratio
    if (signal.riskRewardRatio < 1.5) {
      return { 
        valid: false, 
        reason: `Risk-reward ratio ${signal.riskRewardRatio} below minimum 1.5` 
      };
    }

    // Check if we already have too many open positions
    const openPositions = await signalService.getExecutedPositions();
    if (openPositions.length >= this.riskConfig.maxOpenPositions) {
      return { 
        valid: false, 
        reason: `Maximum open positions (${this.riskConfig.maxOpenPositions}) reached` 
      };
    }

    // Check if symbol already has an open position
    const existingPosition = openPositions.find(p => p.symbol === signal.symbol);
    if (existingPosition) {
      return { 
        valid: false, 
        reason: `Already have open position for ${signal.symbol}` 
      };
    }

    // Check daily PnL limit
    const dailyPnL = await signalService.getDailyPnL();
    if (dailyPnL <= -this.riskConfig.maxDailyLoss) {
      return { 
        valid: false, 
        reason: `Daily loss limit (${this.riskConfig.maxDailyLoss}) reached` 
      };
    }

    return { valid: true };
  }

  calculatePositionSize(
    signal: Signal, 
    accountBalance: number,
    currentPrice: number
  ): { quantity: string; riskAmount: number } {
    const maxRiskAmount = accountBalance * this.riskConfig.maxRiskPerTrade;
    
    // Calculate position size based on stop loss distance
    const priceDiff = Math.abs(currentPrice - parseFloat(signal.stopLoss));
    
    // Ensure minimum price difference to avoid division by very small numbers
    const minPriceDiff = currentPrice * 0.001; // Minimum 0.1% price difference
    const riskPerUnit = Math.max(priceDiff, minPriceDiff);
    
    const maxQuantity = maxRiskAmount / riskPerUnit;
    
    // Apply position size limits
    const maxPositionQuantity = this.riskConfig.maxPositionSize / currentPrice;
    const finalQuantity = Math.min(maxQuantity, maxPositionQuantity);
    
    // Ensure minimum quantity
    const minQuantity = this.getMinimumQuantity(signal.symbol, currentPrice);
    const safeQuantity = Math.max(finalQuantity, minQuantity);
    
    // Round to appropriate decimal places
    const quantity = this.formatQuantity(safeQuantity, signal.symbol);
    const riskAmount = safeQuantity * riskPerUnit;
    
    return { quantity, riskAmount };
  }

  private getMinimumQuantity(_symbol: string, currentPrice: number): number {
    // Calculate minimum quantity based on symbol and price
    // For futures trading with cross margin, ensure minimum position value
    const minPositionValue = 5; // Minimum $5 position value for futures
    return minPositionValue / currentPrice;
  }

  private formatQuantity(quantity: number, symbol: string): string {
    // Basic quantity formatting based on symbol type
    // In a real implementation, you'd get lot size info from Binance
    if (symbol.includes('BTC') || symbol.includes('ETH')) {
      return quantity.toFixed(6);
    } else if (symbol.includes('USDT')) {
      return quantity.toFixed(2);
    } else {
      return quantity.toFixed(4);
    }
  }

  async getRiskSummary(): Promise<{
    openPositions: number;
    maxPositions: number;
    dailyPnL: number;
    maxDailyLoss: number;
    riskPerTrade: number;
  }> {
    const openPositions = await signalService.getExecutedPositions();
    const dailyPnL = await signalService.getDailyPnL();

    return {
      openPositions: openPositions.length,
      maxPositions: this.riskConfig.maxOpenPositions,
      dailyPnL,
      maxDailyLoss: this.riskConfig.maxDailyLoss,
      riskPerTrade: this.riskConfig.maxRiskPerTrade,
    };
  }

  getRiskConfig(): RiskManagement {
    return { ...this.riskConfig };
  }

  updateRiskConfig(newConfig: Partial<RiskManagement>): void {
    this.riskConfig = { ...this.riskConfig, ...newConfig };
  }
}

export const riskManagementService = new RiskManagementService();