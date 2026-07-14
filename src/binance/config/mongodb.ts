import { MongoClient, Db, ChangeStream } from 'mongodb';

export interface MongoDBConfig {
  uri: string;
  database: string;
  signalsCollection: string;
  executionsCollection: string;
}

export function getMongoDBConfig(): MongoDBConfig {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const database = process.env.MONGODB_DATABASE || 'trading_signals';
  const signalsCollection = process.env.MONGODB_SIGNALS_COLLECTION || 'signals';
  const executionsCollection = process.env.MONGODB_EXECUTIONS_COLLECTION || 'executions';

  return {
    uri,
    database,
    signalsCollection,
    executionsCollection,
  };
}

export class MongoDBConnection {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private changeStream: ChangeStream | null = null;
  private onSignalCallback: ((signal: any) => void) | null = null;
  private futuresTradingBot: any = null;

  async connect(): Promise<Db> {
    if (this.db) {
      return this.db;
    }

    const config = getMongoDBConfig();
    
    try {
      this.client = new MongoClient(config.uri);
      await this.client.connect();
      this.db = this.client.db(config.database);
      
      console.log(`Connected to MongoDB: ${config.database}`);
      return this.db;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  setFuturesTradingBot(bot: any): void {
    this.futuresTradingBot = bot;
  }

  async startSignalListener(onSignal: (signal: any) => void): Promise<void> {
    this.onSignalCallback = onSignal;
    
    const collection = this.getSignalsCollection();
    
    this.changeStream = collection.watch([
      {
        $match: {
          operationType: 'insert',
        },
      },
    ]);

    this.changeStream.on('change', async (change) => {
      if (change.operationType === 'insert') {
        console.log('New signal detected:', change.fullDocument);
        
        // Convert MongoDB signal format to expected format
        const mongoSignal = change.fullDocument;
        if (mongoSignal.pair) {
          const convertedSignal = {
            symbol: mongoSignal.pair.symbol,
            signal: mongoSignal.pair.direction === 'LONG' ? 'BUY' : 'SELL',
            entryPrice: mongoSignal.pair.entry.toString(),
            stopLoss: mongoSignal.pair.stop.toString(),
            takeProfit: mongoSignal.pair.targets.length > 0 ? mongoSignal.pair.targets[0].toString() : '0',
            confidence: typeof mongoSignal.pair.confidence_score === 'string' 
              ? parseFloat(mongoSignal.pair.confidence_score.replace('%', '')) / 100
              : mongoSignal.pair.confidence_score / 100,
            strategy: 'quantmirror_pro',
            riskRewardRatio: (() => {
              const rewardRatioParts = mongoSignal.pair.reward_ratio.split(':');
              return rewardRatioParts.length === 2 
                ? parseFloat(rewardRatioParts[1]) / parseFloat(rewardRatioParts[0])
                : 2.8;
            })(),
            timestamp: new Date(mongoSignal.date),
          };
          
          // Call the original callback if set
          if (this.onSignalCallback) {
            this.onSignalCallback(convertedSignal);
          }
          
          // Auto-execute with futures trading bot if available
          if (this.futuresTradingBot && this.futuresTradingBot.isBotRunning()) {
            try {
              console.log(`🤖 Auto-executing futures trade for ${convertedSignal.symbol}`);
              const result = await this.futuresTradingBot.executeSignalTrade(convertedSignal);
              
              if (result.success) {
                console.log(`✅ Auto-execution successful for ${convertedSignal.symbol}`);
              } else {
                console.error(`❌ Auto-execution failed for ${convertedSignal.symbol}: ${result.error}`);
              }
            } catch (error) {
              console.error(`❌ Auto-execution error for ${convertedSignal.symbol}:`, error);
            }
          }
        }
      }
    });

    this.changeStream.on('error', (error) => {
      console.error('MongoDB change stream error:', error);
    });

    console.log('MongoDB signal listener started');
  }

  stopSignalListener(): void {
    if (this.changeStream) {
      this.changeStream.close();
      this.changeStream = null;
      this.onSignalCallback = null;
      console.log('MongoDB signal listener stopped');
    }
  }

  async disconnect(): Promise<void> {
    this.stopSignalListener();
    
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log('Disconnected from MongoDB');
    }
  }

  getDatabase(): Db {
    if (!this.db) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }
    return this.db;
  }

  getSignalsCollection() {
    const config = getMongoDBConfig();
    return this.getDatabase().collection(config.signalsCollection);
  }

  getExecutionsCollection() {
    const config = getMongoDBConfig();
    return this.getDatabase().collection(config.executionsCollection);
  }
}

export const mongoDBConnection = new MongoDBConnection();