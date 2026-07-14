import { MongoClient } from 'mongodb';

export function getMongoDBConfig() {
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
  constructor() {
    this.client = null;
    this.db = null;
    this.changeStream = null;
    this.onSignalCallback = null;
    this.futuresTradingBot = null;
  }

  async connect() {
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

  setFuturesTradingBot(bot) {
    this.futuresTradingBot = bot;
  }

  async startSignalListener(onSignal) {
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

          if (this.onSignalCallback) {
            this.onSignalCallback(convertedSignal);
          }

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

  stopSignalListener() {
    if (this.changeStream) {
      this.changeStream.close();
      this.changeStream = null;
      this.onSignalCallback = null;
      console.log('MongoDB signal listener stopped');
    }
  }

  async disconnect() {
    this.stopSignalListener();

    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log('Disconnected from MongoDB');
    }
  }

  getDatabase() {
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
