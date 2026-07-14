import { z } from 'zod';
import { signalService } from '../services/signal-service.js';
import { riskManagementService } from '../services/risk-management.js';
import { TradeExecutor } from '../services/trade-executor.js';

export const GetTodaySignalsSchema = z.object({
  minConfidence: z.number().min(0).max(1).optional().default(0.7).describe('最小置信度'),
  strategy: z.string().optional().describe('策略名称过滤'),
});

export const ExecuteSignalTradeSchema = z.object({
  symbol: z.string().describe('交易对符号'),
  signal: z.enum(['BUY', 'SELL']).describe('信号方向'),
  entryPrice: z.string().describe('入场价格'),
  stopLoss: z.string().describe('止损价格'),
  takeProfit: z.string().describe('止盈价格'),
  confidence: z.number().min(0).max(1).describe('信号置信度'),
  strategy: z.string().describe('策略名称'),
  riskRewardRatio: z.number().positive().describe('风险回报比'),
});

export const ExecuteTodaySignalsSchema = z.object({
  minConfidence: z.number().min(0).max(1).optional().default(0.7).describe('最小置信度'),
});

export const GetRiskSummarySchema = z.object({});

export const GetTradeHistorySchema = z.object({
  days: z.number().int().positive().optional().default(1).describe('查询天数'),
});


export const signalTradingTools = [
  {
    name: 'get_today_signals',
    description: '获取今日交易信号',
    inputSchema: {
      type: 'object',
      properties: {
        minConfidence: {
          type: 'number',
          description: '最小置信度 (0-1)',
        },
        strategy: {
          type: 'string',
          description: '策略名称过滤',
        },
      },
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = GetTodaySignalsSchema.parse(args);
      
      let signals;
      if (input.strategy) {
        signals = await signalService.getSignalsByStrategy(input.strategy);
      } else {
        signals = await signalService.getTodaySignals();
      }
      
      // Filter by confidence
      const filteredSignals = signals.filter(signal => 
        signal.confidence >= input.minConfidence
      );

      return {
        totalSignals: signals.length,
        filteredSignals: filteredSignals.length,
        signals: filteredSignals.map(signal => ({
          symbol: signal.symbol,
          signal: signal.signal,
          entryPrice: signal.entryPrice,
          stopLoss: signal.stopLoss,
          takeProfit: signal.takeProfit,
          confidence: signal.confidence,
          strategy: signal.strategy,
          riskRewardRatio: signal.riskRewardRatio,
          timestamp: signal.timestamp,
        })),
      };
    },
  },

  {
    name: 'execute_signal_trade',
    description: '执行单个信号交易',
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
      const input = ExecuteSignalTradeSchema.parse(args);
      
      const tradeExecutor = new TradeExecutor(binanceClient);
      
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

      const result = await tradeExecutor.executeSignalBasedTrade(signal);

      return {
        success: result.success,
        order: result.order,
        stopLossOrder: result.stopLossOrder,
        takeProfitOrder: result.takeProfitOrder,
        execution: result.execution,
        error: result.error,
      };
    },
  },

  {
    name: 'execute_today_signals',
    description: '执行今日所有符合条件的信号交易',
    inputSchema: {
      type: 'object',
      properties: {
        minConfidence: {
          type: 'number',
          description: '最小置信度 (0-1)',
        },
      },
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = ExecuteTodaySignalsSchema.parse(args);
      
      const tradeExecutor = new TradeExecutor(binanceClient);
      const result = await tradeExecutor.executeTodaySignals();

      return {
        executionSummary: {
          totalSignals: result.totalSignals,
          executedTrades: result.executedTrades,
          failedTrades: result.failedTrades,
          successRate: result.executedTrades / result.totalSignals,
        },
        detailedResults: result.results,
      };
    },
  },

  {
    name: 'get_risk_summary',
    description: '获取风险管理摘要',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (binanceClient: any, args: unknown) => {
      const riskSummary = await riskManagementService.getRiskSummary();
      const riskConfig = riskManagementService.getRiskConfig();

      return {
        riskSummary,
        riskConfig,
      };
    },
  },

  {
    name: 'get_trade_history',
    description: '获取交易历史',
    inputSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: '查询天数',
        },
      },
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = GetTradeHistorySchema.parse(args);
      
      const executions = await signalService.getTodayExecutions();
      
      // Filter by days (simplified - in real implementation you'd query by date range)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - input.days);
      
      const filteredExecutions = executions.filter(execution => 
        execution.timestamp >= cutoffDate
      );

      const stats = {
        totalTrades: filteredExecutions.length,
        executedTrades: filteredExecutions.filter(e => e.status === 'EXECUTED').length,
        pendingTrades: filteredExecutions.filter(e => e.status === 'PENDING').length,
        failedTrades: filteredExecutions.filter(e => e.status === 'FAILED').length,
        cancelledTrades: filteredExecutions.filter(e => e.status === 'CANCELLED').length,
      };

      return {
        period: `${input.days}天`,
        statistics: stats,
        executions: filteredExecutions.map(execution => ({
          symbol: execution.symbol,
          side: execution.side,
          type: execution.type,
          quantity: execution.quantity,
          price: execution.price,
          stopLoss: execution.stopLoss,
          takeProfit: execution.takeProfit,
          status: execution.status,
          timestamp: execution.timestamp,
        })),
      };
    },
  },

  {
    name: 'update_risk_config',
    description: '更新风险管理配置',
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
      },
    },
    handler: async (binanceClient: any, args: unknown) => {
      const input = z.object({
        maxPositionSize: z.number().positive().optional(),
        maxRiskPerTrade: z.number().min(0).max(1).optional(),
        maxDailyLoss: z.number().positive().optional(),
        maxOpenPositions: z.number().int().positive().optional(),
        minConfidence: z.number().min(0).max(1).optional(),
      }).parse(args);

      riskManagementService.updateRiskConfig(input);

      return {
        message: '风险管理配置已更新',
        newConfig: riskManagementService.getRiskConfig(),
      };
    },
  },

];