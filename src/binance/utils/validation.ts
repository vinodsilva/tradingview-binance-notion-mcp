import { z } from 'zod';

export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      throw new Error(`Validation error: ${issues}`);
    }
    throw error;
  }
}

export function isValidSymbol(symbol: string): boolean {
  return /^[A-Z]{3,}[A-Z]{3,}$/.test(symbol);
}

export function formatQuantity(quantity: number, symbol: string): string {
  // Common quantity precision rules for Binance
  const precisionRules: Record<string, number> = {
    'BTCUSDT': 3,
    'ETHUSDT': 3,
    'ADAUSDT': 0,
    'BNBUSDT': 2,
    'XRPUSDT': 0,
    'DOTUSDT': 1,
    'LINKUSDT': 1,
    'LTCUSDT': 2,
    'BCHUSDT': 3,
    'EOSUSDT': 0,
    'TRXUSDT': 0,
    'ETCUSDT': 2,
    'XLMUSDT': 0,
    'XMRUSDT': 3,
    'DASHUSDT': 3,
    'ZECUSDT': 3,
    'XTZUSDT': 1,
    'ATOMUSDT': 2,
    'ALGOUSDT': 0,
    'KAVAUSDT': 0,
    'BANDUSDT': 1,
    'RLCUSDT': 1,
    'COCOSUSDT': 0,
    'TROYUSDT': 0,
    'PERLUSDT': 0,
    'DUSKUSDT': 0,
    'WTCUSDT': 2,
    'DATAUSDT': 0,
    'CTXCUSDT': 1,
    'ADXUSDT': 1,
    'LTOUSDT': 0,
    'MBLUSDT': 0,
    'COTIUSDT': 0,
    'KEYUSDT': 0,
    'DOCKUSDT': 0,
    'WANUSDT': 1,
    'FUNUSDT': 0,
    'CVCUSDT': 0,
    'CHZUSDT': 0,
    'BEAMUSDT': 0,
    'RVNUSDT': 0,
    'HBARUSDT': 0,
    'NKNUSDT': 0,
    'STXUSDT': 0,
    'ARPAUSDT': 0,
    'IOTXUSDT': 0,
    'MCOUSDT': 2,
    'CTSIUSDT': 0,
    'CHRUSDT': 0,
    'MDTUSDT': 0,
    'STMXUSDT': 0,
    'KNCUSDT': 1,
    'LRCUSDT': 0,
    'COMPUSDT': 3,
    'BALUSDT': 2,
    'YFIUSDT': 5,
    'CRVUSDT': 1,
    'SANDUSDT': 0,
    'MANAUSDT': 0,
    'AXSUSDT': 2,
    'SUSHIUSDT': 1,
    'UNIUSDT': 1,
    'AAVEUSDT': 3,
    'MKRUSDT': 4,
    'SNXUSDT': 1,
    'UMAUSDT': 1,
    'RENUSDT': 0,
    'BZRXUSDT': 0,
    'RSRUSDT': 0,
    'TRBUSDT': 3,
    'BATUSDT': 0,
    'ZRXUSDT': 0,
    'REPUSDT': 2,
    'NMRUSDT': 2,
    'ANTUSDT': 1,
    'COAIUSDT': 0, // COAIUSDT likely has 0 decimal precision
  };

  const precision = precisionRules[symbol] ?? 2; // Default to 2 decimal places
  return quantity.toFixed(precision);
}

export function getKnownSymbols(): string[] {
  return [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'DOTUSDT', 'LINKUSDT', 'LTCUSDT',
    'BCHUSDT', 'EOSUSDT', 'TRXUSDT', 'ETCUSDT', 'XLMUSDT', 'XMRUSDT', 'DASHUSDT', 'ZECUSDT',
    'XTZUSDT', 'ATOMUSDT', 'ALGOUSDT', 'KAVAUSDT', 'BANDUSDT', 'RLCUSDT', 'COCOSUSDT',
    'TROYUSDT', 'PERLUSDT', 'DUSKUSDT', 'WTCUSDT', 'DATAUSDT', 'CTXCUSDT', 'ADXUSDT',
    'LTOUSDT', 'MBLUSDT', 'COTIUSDT', 'KEYUSDT', 'DOCKUSDT', 'WANUSDT', 'FUNUSDT',
    'CVCUSDT', 'CHZUSDT', 'BEAMUSDT', 'RVNUSDT', 'HBARUSDT', 'NKNUSDT', 'STXUSDT',
    'ARPAUSDT', 'IOTXUSDT', 'MCOUSDT', 'CTSIUSDT', 'CHRUSDT', 'MDTUSDT', 'STMXUSDT',
    'KNCUSDT', 'LRCUSDT', 'COMPUSDT', 'BALUSDT', 'YFIUSDT', 'CRVUSDT', 'SANDUSDT',
    'MANAUSDT', 'AXSUSDT', 'SUSHIUSDT', 'UNIUSDT', 'AAVEUSDT', 'MKRUSDT', 'SNXUSDT',
    'UMAUSDT', 'RENUSDT', 'BZRXUSDT', 'RSRUSDT', 'TRBUSDT', 'BATUSDT', 'ZRXUSDT',
    'REPUSDT', 'NMRUSDT', 'ANTUSDT'
  ];
}

export function isKnownSymbol(symbol: string): boolean {
  return getKnownSymbols().includes(symbol);
}

export function validateSymbol(symbol: string): void {
  if (!isValidSymbol(symbol)) {
    throw new Error(`Invalid symbol format: ${symbol}. Expected format like BTCUSDT`);
  }
  
  if (!isKnownSymbol(symbol)) {
    console.warn(`⚠️  Warning: Symbol ${symbol} is not in the known Binance symbols list. Trading may fail if this symbol doesn't exist.`);
  }
}

export function validateQuantity(quantity: string): void {
  const num = parseFloat(quantity);
  if (isNaN(num) || num <= 0) {
    throw new Error(`Invalid quantity: ${quantity}. Must be a positive number`);
  }
}

export function validatePrice(price: string): void {
  const num = parseFloat(price);
  if (isNaN(num) || num <= 0) {
    throw new Error(`Invalid price: ${price}. Must be a positive number`);
  }
}