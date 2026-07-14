import { z } from 'zod';
import { FuturesTradingBot } from '../services/futures-trading-bot.js';
import { FuturesRiskManagement } from '../services/futures-risk-management.js';
import { FuturesClient } from '../services/futures-client.js';

export const StartFuturesBotSchema = z.object({
  autoStart: z.boolean().optional().default(true).describe('Auto-start bot on server startup'),
});

export const StopFuturesBotSchema = z.object({});

export const ExecuteFuturesSignalTradeSchema = z.object({
  symbol: z.string().describe('交易对符号'),
  signal: z.enum(['BUY', 'SELL']).describe('信号方向'),
  entryPrice: z.string().describe('入场价格'),
  stopLoss: z.string().describe('止损价格'),
  takeProfit: z.string().describe('止盈价格'),
  confidence: z.number().min(0).max(1).describe('信号置信度'),
  strategy: z.string().describe('策略名称'),
  riskRewardRatio: z.number().positive().describe('风险回报比'),
});

export const GetFuturesRiskSummarySchema = z.object({});

export const GetFuturesPositionsSchema = z.object({});

export const UpdateFuturesRiskConfigSchema = z.object({
  maxPositionSize: z.number().positive().optional().describe('最大仓位规模（USDT）'),
  maxRiskPerTrade: z.number().min(0).max(1).optional().describe('单笔交易最大风险比例'),
  maxDailyLoss: z.number().positive().optional().describe('最大单日亏损（USDT）'),
  maxOpenPositions: z.number().int().positive().optional().describe('最大同时持仓数量'),
  minConfidence: z.number().min(0).max(1).optional().describe('最小信号置信度'),
  maxLeverage: z.number().int().positive().optional().describe('最大杠杆倍数'),
  liquidationBuffer: z.number().min(0).max(1).optional().describe('清算缓冲比例'),
  autoLeverage: z.boolean().optional().describe('自动杠杆调整'),
});

export const GetFuturesAccountInfoSchema = z.object({});

export const CancelFuturesOrdersSchema = z.object({
  symbol: z.string().describe('交易对符号'),
});

export const TestFuturesTradeSchema = z.object({
  symbol: z.string().describe('交易对符号'),
  side: z.enum(['BUY', 'SELL']).describe('交易方向'),
  entryPrice: z.string().describe('入场价格'),
  stopLoss: z.string().describe('止损价格'),
  takeProfit: z.string().describe('止盈价格'),
});

export const futuresTradingTools = [
  {
    name: 'start_futures_bot',
    description: '启动期货交易机器人（24/7自动交易）',
    inputSchema: {
      type: 'object',
      properties: {
        autoStart: {
          type: 'boolean',
          description: '是否自动启动机器人',
        },
      },
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = StartFuturesBotSchema.parse(args);
      
      const futuresBot = new FuturesTradingBot({
        autoStart: input.autoStart,
      });
      
      await futuresBot.start();
      
      return {
        success: true,
        message: 'Futures trading bot started successfully',
        config: futuresBot.getBotConfig(),
      };
    },
  },

  {
    name: 'stop_futures_bot',
    description: '停止期货交易机器人',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = StopFuturesBotSchema.parse(args);
      
      const futuresBot = new FuturesTradingBot();
      await futuresBot.stop();
      
      return {
        success: true,
        message: 'Futures trading bot stopped successfully',
      };
    },
  },

  {
    name: 'execute_futures_signal_trade',
    description: '执行期货信号交易（带杠杆）',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: '交易对符号，如 BTCUSDT',
        },
        signal: {
          type: 'string',
          enum: ['BUY', 'SELL'],
          description: '信号方向',
        },
        entryPrice: {
          type: 'string',
          description: '入场价格',
        },
        stopLoss: {
          type: 'string',
          description: '止损价格',
        },
        takeProfit: {
          type: 'string',
          description: '止盈价格',
        },
        confidence: {
          type: 'number',
          description: '信号置信度 (0-1)',
        },
        strategy: {
          type: 'string',
          description: '策略名称',
        },
        riskRewardRatio: {
          type: 'number',
          description: '风险回报比',
        },
      },
      required: ['symbol', 'signal', 'entryPrice', 'stopLoss', 'takeProfit', 'confidence', 'strategy', 'riskRewardRatio'],
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = ExecuteFuturesSignalTradeSchema.parse(args);
      
      const futuresBot = new FuturesTradingBot();
      
      const signal = {
        symbol: input.symbol,
        signal: input.signal,
        entryPrice: input.entryPrice,
        stopLoss: input.stopLoss,
        takeProfit: input.takeProfit,
        confidence: input.confidence,
        strategy: input.strategy,
        riskRewardRatio: input.riskRewardRatio,
        timestamp: new Date(),
      };

      const result = await futuresBot.executeSignalTrade(signal);

      return {
        success: result.success,
        order: result.order,
        stopLossOrder: result.stopLossOrder,
        takeProfitOrder: result.takeProfitOrder,
        execution: result.execution,
        riskValidation: result.riskValidation,
        error: result.error,
      };
    },
  },

  {
    name: 'get_futures_risk_summary',
    description: '获取期货风险管理摘要',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = GetFuturesRiskSummarySchema.parse(args);
      
      const futuresClient = new FuturesClient();
      const riskManagement = new FuturesRiskManagement(futuresClient);
      
      const riskSummary = await riskManagement.getRiskSummary();
      const riskConfig = riskManagement.getRiskConfig();

      return {
        riskSummary,
        riskConfig,
      };
    },
  },

  {
    name: 'get_futures_positions',
    description: '获取当前期货持仓',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = GetFuturesPositionsSchema.parse(args);
      
      const futuresClient = new FuturesClient();
      
      const positions = await futuresClient.getPositions();
      const riskManagement = new FuturesRiskManagement(futuresClient);
      
      // Check liquidation risk for each position
      const positionsWithRisk = await Promise.all(
        positions.map(async (position) => {
          const risk = await riskManagement.checkLiquidationRisk(position);
          return {
            ...position,
            liquidationRisk: {
              atRisk: risk.atRisk,
              distance: risk.distance,
            },
          };
        })
      );

      return {
        totalPositions: positions.length,
        positions: positionsWithRisk,
      };
    },
  },

  {
    name: 'update_futures_risk_config',
    description: '更新期货风险管理配置',
    inputSchema: {
      type: 'object',
      properties: {
        maxPositionSize: {
          type: 'number',
          description: '最大仓位规模（USDT）',
        },
        maxRiskPerTrade: {
          type: 'number',
          description: '单笔交易最大风险比例',
        },
        maxDailyLoss: {
          type: 'number',
          description: '最大单日亏损（USDT）',
        },
        maxOpenPositions: {
          type: 'number',
          description: '最大同时持仓数量',
        },
        minConfidence: {
          type: 'number',
          description: '最小信号置信度',
        },
        maxLeverage: {
          type: 'number',
          description: '最大杠杆倍数',
        },
        liquidationBuffer: {
          type: 'number',
          description: '清算缓冲比例',
        },
        autoLeverage: {
          type: 'boolean',
          description: '自动杠杆调整',
        },
      },
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = UpdateFuturesRiskConfigSchema.parse(args);
      
      const futuresClient = new FuturesClient();
      const riskManagement = new FuturesRiskManagement(futuresClient);
      
      riskManagement.updateRiskConfig(input);

      return {
        message: 'Futures risk management configuration updated',
        newConfig: riskManagement.getRiskConfig(),
      };
    },
  },

  {
    name: 'get_futures_account_info',
    description: '获取期货账户信息',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = GetFuturesAccountInfoSchema.parse(args);
      
      const futuresClient = new FuturesClient();
      
      const accountInfo = await futuresClient.getAccountInfo();
      const positions = await futuresClient.getPositions();
      const openOrders = await futuresClient.getOpenOrders();

      return {
        accountInfo: {
          totalWalletBalance: accountInfo.totalWalletBalance,
          availableBalance: accountInfo.availableBalance,
          totalUnrealizedProfit: accountInfo.totalUnrealizedProfit,
          totalMarginBalance: accountInfo.totalMarginBalance,
          totalPositionInitialMargin: accountInfo.totalPositionInitialMargin,
          totalOpenOrderInitialMargin: accountInfo.totalOpenOrderInitialMargin,
        },
        positions: {
          total: positions.length,
          details: positions,
        },
        openOrders: {
          total: openOrders.length,
          details: openOrders,
        },
      };
    },
  },

  {
    name: 'cancel_futures_orders',
    description: '取消期货订单',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: '交易对符号',
        },
      },
      required: ['symbol'],
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = CancelFuturesOrdersSchema.parse(args);
      
      const futuresClient = new FuturesClient();
      
      await futuresClient.cancelAllOpenOrders(input.symbol);

      return {
        success: true,
        message: `All open orders for ${input.symbol} cancelled successfully`,
      };
    },
  },

  {
    name: 'test_futures_trade',
    description: '测试期货交易执行（固定5美元价值）',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: '交易对符号，如 BTCUSDT',
        },
        side: {
          type: 'string',
          enum: ['BUY', 'SELL'],
          description: '交易方向',
        },
        entryPrice: {
          type: 'string',
          description: '入场价格',
        },
        stopLoss: {
          type: 'string',
          description: '止损价格',
        },
        takeProfit: {
          type: 'string',
          description: '止盈价格',
        },
      },
      required: ['symbol', 'side', 'entryPrice', 'stopLoss', 'takeProfit'],
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = TestFuturesTradeSchema.parse(args);
      
      const futuresBot = new FuturesTradingBot();
      
      const result = await futuresBot.testTradeWithFixedValue(
        input.symbol,
        input.side,
        input.entryPrice,
        input.stopLoss,
        input.takeProfit
      );

      return {
        success: result.success,
        order: result.order,
        execution: result.execution,
        error: result.error,
      };
    },
  },
];