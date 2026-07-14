import { z } from 'zod';

export const SignalSchema = z.object({
  symbol: z.string().describe('交易对符号，如 BTCUSDT'),
  signal: z.enum(['BUY', 'SELL']).describe('信号方向'),
  entryPrice: z.string().describe('入场价格'),
  stopLoss: z.string().describe('止损价格'),
  takeProfit: z.string().describe('止盈价格'),
  confidence: z.number().min(0).max(1).describe('信号置信度'),
  timestamp: z.date().describe('信号生成时间'),
  strategy: z.string().describe('策略名称'),
  riskRewardRatio: z.number().positive().describe('风险回报比'),
});

export type Signal = z.infer<typeof SignalSchema>;

export const TradeExecutionSchema = z.object({
  symbol: z.string().describe('交易对符号'),
  side: z.enum(['BUY', 'SELL']).describe('买卖方向'),
  type: z.literal('LIMIT').describe('订单类型'),
  quantity: z.string().describe('数量'),
  price: z.string().describe('价格'),
  stopLoss: z.string().describe('止损价格'),
  takeProfit: z.string().describe('止盈价格'),
  signalId: z.string().describe('信号ID'),
  timestamp: z.date().describe('执行时间'),
  status: z.enum(['PENDING', 'EXECUTED', 'CANCELLED', 'FAILED']).describe('执行状态'),
  entryOrderId: z.string().optional().describe('入场订单ID'),
  stopLossOrderId: z.string().optional().describe('止损订单ID'),
  takeProfitOrderId: z.string().optional().describe('止盈订单ID'),
});

export type TradeExecution = z.infer<typeof TradeExecutionSchema>;

export const RiskManagementSchema = z.object({
  maxPositionSize: z.number().positive().describe('最大仓位规模（USDT）'),
  maxRiskPerTrade: z.number().min(0).max(1).describe('单笔交易最大风险比例'),
  maxDailyLoss: z.number().positive().describe('最大单日亏损（USDT）'),
  maxOpenPositions: z.number().int().positive().describe('最大同时持仓数量'),
  minConfidence: z.number().min(0).max(1).describe('最小信号置信度'),
});

export type RiskManagement = z.infer<typeof RiskManagementSchema>;