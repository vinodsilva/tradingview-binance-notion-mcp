import { ObjectId } from 'mongodb';
import { Signal, TradeExecution, RiskManagement } from '../types/signals.js';
import { mongoDBConnection } from '../config/mongodb.js';

// Interface for the actual MongoDB signal format
interface MongoDBSignal {
  _id: ObjectId;
  pair: {
    symbol: string;
    direction: 'LONG' | 'SHORT';
    entry: number | string;
    stop: number | string;
    targets: (number | string)[];
    leverage: string;
    risk_percent: string;
    reward_ratio: string;
    confidence_score: number | string;
    confidence_grade: string;
    current_price: number | string;
    rationale: string[];
  };
  date: string;
}

export class SignalService {
  
  private convertMongoSignalToSignal(mongoSignal: MongoDBSignal): Signal {
    const pair = mongoSignal.pair;
    
    // Convert direction to signal
    const signal = pair.direction === 'LONG' ? 'BUY' : 'SELL';
    
    // Convert confidence from 0-100 to 0-1
    const confidence = typeof pair.confidence_score === 'string' 
      ? parseFloat(pair.confidence_score) / 100 
      : pair.confidence_score / 100;
    
    // Use first target as take profit
    const takeProfit = pair.targets.length > 0 ? pair.targets[0].toString() : '0';
    
    // Calculate risk-reward ratio from reward_ratio string (e.g., "1:3")
    const rewardRatioParts = pair.reward_ratio.split(':');
    const riskRewardRatio = rewardRatioParts.length === 2 
      ? parseFloat(rewardRatioParts[0]) / parseFloat(rewardRatioParts[1])
      : 2.0; // Default to 2:1

    return {
      symbol: pair.symbol,
      signal,
      entryPrice: pair.entry.toString(),
      stopLoss: pair.stop.toString(),
      takeProfit,
      confidence,
      strategy: 'quantmirror_pro', // Fixed strategy name
      riskRewardRatio,
      timestamp: new Date(mongoSignal.date),
    };
  }

  async getTodaySignals(): Promise<Signal[]> {
    const collection = mongoDBConnection.getSignalsCollection();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const mongoSignals = await collection
      .find({
        date: {
          $gte: today.toISOString(),
          $lt: tomorrow.toISOString(),
        },
      })
      .sort({ date: -1 })
      .toArray();

    const convertedSignals = (mongoSignals as unknown as MongoDBSignal[]).map(
      signal => this.convertMongoSignalToSignal(signal)
    );

    return convertedSignals;
  }

  async getSignalsByStrategy(strategy: string): Promise<Signal[]> {
    const collection = mongoDBConnection.getSignalsCollection();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const mongoSignals = await collection
      .find({
        date: { $gte: today.toISOString() },
      })
      .sort({ date: -1 })
      .toArray();

    const convertedSignals = (mongoSignals as unknown as MongoDBSignal[]).map(
      signal => this.convertMongoSignalToSignal(signal)
    );

    // Filter by strategy (all signals now have 'quantmirror_pro' strategy)
    return convertedSignals.filter(signal => signal.strategy === strategy);
  }

  async getHighConfidenceSignals(minConfidence: number = 0.7): Promise<Signal[]> {
    const collection = mongoDBConnection.getSignalsCollection();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const mongoSignals = await collection
      .find({
        date: { $gte: today.toISOString() },
      })
      .sort({ date: -1 })
      .toArray();

    const convertedSignals = (mongoSignals as unknown as MongoDBSignal[]).map(
      signal => this.convertMongoSignalToSignal(signal)
    );

    // Filter by confidence after conversion
    return convertedSignals.filter(signal => signal.confidence >= minConfidence);
  }

  async saveExecution(execution: Omit<TradeExecution, '_id'>): Promise<string> {
    const collection = mongoDBConnection.getExecutionsCollection();
    
    const result = await collection.insertOne({
      ...execution,
      _id: new ObjectId(),
    });

    return result.insertedId.toString();
  }

  async getTodayExecutions(): Promise<TradeExecution[]> {
    const collection = mongoDBConnection.getExecutionsCollection();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const executions = await collection
      .find({
        timestamp: { $gte: today },
      })
      .sort({ timestamp: -1 })
      .toArray();

    return executions as unknown as TradeExecution[];
  }

  async updateExecutionStatus(executionId: string, status: TradeExecution['status']): Promise<void> {
    const collection = mongoDBConnection.getExecutionsCollection();
    
    await collection.updateOne(
      { _id: new ObjectId(executionId) },
      { $set: { status } }
    );
  }

  async updateExecutionWithOrderIds(
    executionId: string, 
    status: TradeExecution['status'],
    entryOrderId?: string,
    stopLossOrderId?: string,
    takeProfitOrderId?: string
  ): Promise<void> {
    const collection = mongoDBConnection.getExecutionsCollection();
    
    const updateData: any = { status };
    if (entryOrderId) updateData.entryOrderId = entryOrderId;
    if (stopLossOrderId) updateData.stopLossOrderId = stopLossOrderId;
    if (takeProfitOrderId) updateData.takeProfitOrderId = takeProfitOrderId;
    
    await collection.updateOne(
      { _id: new ObjectId(executionId) },
      { $set: updateData }
    );
  }

  async getExecutedPositions(): Promise<TradeExecution[]> {
    const collection = mongoDBConnection.getExecutionsCollection();
    
    const executions = await collection
      .find({
        status: 'EXECUTED',
      })
      .sort({ timestamp: -1 })
      .toArray();

    return executions as unknown as TradeExecution[];
  }

  async getDailyPnL(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const executions = await this.getTodayExecutions();
    
    // This is a simplified PnL calculation
    // In a real implementation, you'd track actual profit/loss from closed positions
    return executions.filter(e => e.status === 'EXECUTED').length * 100; // Mock PnL
  }
}

export const signalService = new SignalService();