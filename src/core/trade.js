import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRADE_DIR = path.join(path.dirname(path.dirname(__dirname)), 'trades');
const TRADE_FILE = path.join(TRADE_DIR, 'journal.json');

function ensureDir() {
  mkdirSync(TRADE_DIR, { recursive: true });
}

function loadAll() {
  ensureDir();
  if (!existsSync(TRADE_FILE)) return [];
  try {
    const raw = readFileSync(TRADE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveAll(trades) {
  ensureDir();
  writeFileSync(TRADE_FILE, JSON.stringify(trades, null, 2), 'utf-8');
}

function uuid() {
  return 'tx_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

export function createTrade(data) {
  const trades = loadAll();
  const trade = {
    id: uuid(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    symbol: data.symbol || '',
    direction: data.direction || '',
    decision: data.decision || 'IDEA',
    setup_type: data.setup_type || '',
    grade: data.grade || '',
    status: 'IDEA',
    entry: data.entry || { price: null, zone_low: null, zone_high: null, trigger: '', model: '' },
    stop_loss: data.stop_loss || { price: null, type: '' },
    targets: data.targets || { tp1: {price: null, rr: 0, source: ''}, tp2: {price: null, rr: 0, source: ''}, tp3: {price: null, rr: 0, source: ''} },
    risk: data.risk || { conviction: '', risk_pct: 0, position_size: 0, leverage: 0 },
    confluence: data.confluence || { score: 0, confidence: 0, direction: '', liquidity_quality: '' },
    structure: data.structure || { trend: '', phase: '', mtf_alignment: '' },
    volume: data.volume || { regime: '', score: 0 },
    momentum: data.momentum || { trend_health: 0, divergence: '', mtf_alignment: '' },
    fib: data.fib || { ote_zone: null, clusters: [] },
    reasons: data.reasons || [],
    invalidations: data.invalidations || [],
    screenshot_path: data.screenshot_path || '',
    notes: data.notes || '',
    result: null,
  };
  trades.unshift(trade);
  saveAll(trades);
  return { success: true, trade };
}

export function getTrades({ status, symbol, limit } = {}) {
  let trades = loadAll();
  if (status) trades = trades.filter(t => t.status === status);
  if (symbol) trades = trades.filter(t => t.symbol.toUpperCase().includes(symbol.toUpperCase()));
  if (limit) trades = trades.slice(0, limit);
  return { success: true, count: trades.length, trades };
}

export function getTrade({ id }) {
  const trades = loadAll();
  const trade = trades.find(t => t.id === id);
  if (!trade) return { success: false, error: 'Trade not found: ' + id };
  return { success: true, trade };
}

export function updateTrade({ id, updates }) {
  const trades = loadAll();
  const idx = trades.findIndex(t => t.id === id);
  if (idx === -1) return { success: false, error: 'Trade not found: ' + id };
  trades[idx] = { ...trades[idx], ...updates, updated_at: new Date().toISOString() };
  saveAll(trades);
  return { success: true, trade: trades[idx] };
}

export function deleteTrade({ id }) {
  const trades = loadAll();
  const filtered = trades.filter(t => t.id !== id);
  if (filtered.length === trades.length) return { success: false, error: 'Trade not found: ' + id };
  saveAll(filtered);
  return { success: true };
}

export function getStats() {
  const trades = loadAll();
  const total = trades.length;
  const active = trades.filter(t => t.status === 'ACTIVE').length;
  const winners = trades.filter(t => t.result && t.result.pnl > 0).length;
  const losers = trades.filter(t => t.result && t.result.pnl < 0).length;
  const winRate = (winners + losers) > 0 ? (winners / (winners + losers) * 100).toFixed(1) : 0;
  const totalPnl = trades.reduce((s, t) => s + (t.result?.pnl || 0), 0);
  return { success: true, stats: { total, active, winners, losers, winRate: parseFloat(winRate), totalPnl } };
}

export function exportJson({ id }) {
  if (id) {
    const r = getTrade({ id });
    if (!r.success) return r;
    return { success: true, json: JSON.stringify(r.trade, null, 2) };
  }
  const trades = loadAll();
  return { success: true, json: JSON.stringify(trades, null, 2) };
}
