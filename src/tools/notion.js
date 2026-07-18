import { z } from 'zod';
import { jsonResult } from './_format.js';
import * as core from '../core/notion.js';

export function registerNotionTools(server) {
  server.tool('notion_log_trade', 'Log a completed trade to Notion trade journal database', {
    symbol: z.string().describe('Trading pair symbol (e.g., BTCUSDT)'),
    direction: z.enum(['ENTER_LONG', 'ENTER_SHORT']).describe('Trade direction'),
    date: z.string().optional().describe('ISO date string (default: now)'),
    grade: z.string().optional().describe('Grade: A+, A, B, C'),
    win_probability: z.number().optional().describe('Win probability 0-100'),
    setup_type: z.string().optional().describe('Setup type (LIQUIDITY_RECLAIM, FVG, OB, OTE, etc.)'),
    entry_price: z.number().optional().describe('Entry price'),
    stop_loss: z.number().optional().describe('Stop loss price'),
    tp1: z.number().optional().describe('Take profit 1 price'),
    tp2: z.number().optional().describe('Take profit 2 price'),
    tp3: z.number().optional().describe('Take profit 3 price'),
    rr: z.number().optional().describe('Risk-reward ratio'),
    leverage: z.number().optional().describe('Leverage used'),
    conviction: z.string().optional().describe('Conviction: SNIPER, NORMAL, HALF, THIN'),
    risk_pct: z.number().optional().describe('Account risk percentage'),
    liquidity_quality: z.string().optional().describe('HTF, SESSION, or INTERNAL'),
    reasons: z.array(z.string()).optional().describe('List of trade reasons'),
    notes: z.string().optional().describe('Additional notes'),
  }, async (params) => {
    try {
      const result = await core.logTradeToNotion(params);
      return jsonResult(result);
    } catch (err) {
      return jsonResult({ success: false, error: err.message }, true);
    }
  });

  server.tool('notion_update_exit', 'Update a trade log with exit details', {
    page_id: z.string().describe('Notion page ID from notion_log_trade response'),
    exit_price: z.number().optional().describe('Exit price'),
    pnl: z.number().optional().describe('P&L in quote currency'),
    pnl_pct: z.number().optional().describe('P&L percentage'),
    result: z.enum(['WIN', 'LOSS', 'BREAKEVEN']).optional().describe('Trade result'),
    exit_reason: z.string().optional().describe('Reason for exit (TP, SL, manual, etc.)'),
    notes: z.string().optional().describe('Additional notes'),
  }, async ({ page_id, ...exitData }) => {
    try {
      const result = await core.updateTradeExit(page_id, exitData);
      return jsonResult(result);
    } catch (err) {
      return jsonResult({ success: false, error: err.message }, true);
    }
  });

  server.tool('notion_check_schema', 'Check the schema of your Notion trade database', {}, async () => {
    try {
      const result = await core.getTradeDbSchema();
      return jsonResult(result);
    } catch (err) {
      return jsonResult({ success: false, error: err.message }, true);
    }
  });
}
