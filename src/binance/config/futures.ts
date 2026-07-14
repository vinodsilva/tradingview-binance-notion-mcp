import { config } from 'dotenv';

config();

export interface FuturesConfig {
  apiKey: string;
  apiSecret: string;
  testnet: boolean;
  recvWindow: number;
  timeout: number;
  leverage: number;
  marginType: 'ISOLATED' | 'CROSSED';
  positionMode: 'HEDGE' | 'ONE_WAY';
  maxPositionSize: number;
  maxRiskPerTrade: number;
  maxDailyLoss: number;
  maxOpenPositions: number;
  minConfidence: number;
  autoLeverage: boolean;
  liquidationBuffer: number;
}

export function getFuturesConfig(): FuturesConfig {
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;
  const testnet = process.env.BINANCE_TESTNET === 'true';

  if (!apiKey || !apiSecret) {
    throw new Error('BINANCE_API_KEY and BINANCE_API_SECRET must be set in environment variables');
  }

  return {
    apiKey,
    apiSecret,
    testnet,
    recvWindow: parseInt(process.env.FUTURES_RECV_WINDOW || '60000'),
    timeout: parseInt(process.env.FUTURES_TIMEOUT || '15000'),
    leverage: parseInt(process.env.FUTURES_LEVERAGE || '5'),
    marginType: (process.env.FUTURES_MARGIN_TYPE || 'CROSSED') as 'ISOLATED' | 'CROSSED',
    positionMode: (process.env.FUTURES_POSITION_MODE || 'ONE_WAY') as 'HEDGE' | 'ONE_WAY',
    maxPositionSize: parseFloat(process.env.FUTURES_MAX_POSITION_SIZE || '1000'),
    maxRiskPerTrade: parseFloat(process.env.FUTURES_MAX_RISK_PER_TRADE || '0.01'),
    maxDailyLoss: parseFloat(process.env.FUTURES_MAX_DAILY_LOSS || '200'),
    maxOpenPositions: parseInt(process.env.FUTURES_MAX_OPEN_POSITIONS || '5'),
    minConfidence: parseFloat(process.env.FUTURES_MIN_CONFIDENCE || '0.7'),
    autoLeverage: process.env.FUTURES_AUTO_LEVERAGE === 'true',
    liquidationBuffer: parseFloat(process.env.FUTURES_LIQUIDATION_BUFFER || '0.05'),
  };
}

export function getFuturesBaseUrl(testnet: boolean): string {
  return testnet 
    ? 'https://testnet.binancefuture.com'
    : 'https://fapi.binance.com';
}

export function validateFuturesEnvironment(): void {
  const requiredEnvVars = ['BINANCE_API_KEY', 'BINANCE_API_SECRET'];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Required environment variable ${envVar} is not set`);
    }
  }
}

export function isFuturesTestnetEnabled(): boolean {
  return process.env.BINANCE_TESTNET === 'true';
}