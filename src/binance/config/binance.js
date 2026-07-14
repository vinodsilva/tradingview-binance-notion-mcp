import Binance from 'binance-api-node';

export function getBinanceConfig() {
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;
  const testnet = process.env.BINANCE_TESTNET === 'true';

  if (!apiKey || !apiSecret) {
    throw new Error('BINANCE_API_KEY and BINANCE_API_SECRET must be set in environment variables');
  }

  return {
    apiKey,
    apiSecret,
    sandbox: testnet,
    recvWindow: 60000,
    timeout: 15000,
    disableBeautification: true,
  };
}

export function createBinanceClient() {
  const config = getBinanceConfig();
  return Binance({
    apiKey: config.apiKey,
    apiSecret: config.apiSecret,
    httpBase: config.sandbox ? 'https://testnet.binance.vision' : 'https://api.binance.com',
  });
}

export function validateEnvironment() {
  const requiredEnvVars = ['BINANCE_API_KEY', 'BINANCE_API_SECRET'];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Required environment variable ${envVar} is not set`);
    }
  }
}

export function isTestnetEnabled() {
  return process.env.BINANCE_TESTNET === 'true';
}

export function getNetworkMode() {
  return isTestnetEnabled() ? 'testnet' : 'mainnet';
}

export function getServerConfig() {
  return {
    name: process.env.MCP_SERVER_NAME || 'binance-mcp-server',
    version: process.env.MCP_SERVER_VERSION || '1.0.0',
  };
}
