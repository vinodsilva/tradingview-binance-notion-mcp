const API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

function getConfig() {
  const apiKey = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_TRADE_DB_ID;
  if (!apiKey) throw new Error('NOTION_API_KEY env var not set');
  if (!dbId) throw new Error('NOTION_TRADE_DB_ID env var not set');
  return { apiKey, dbId };
}

async function notionRequest(endpoint, method, body) {
  const { apiKey } = getConfig();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Notion API error: ${json.message || json.code || res.status}`);
  return json;
}

function toNotionText(str) {
  return { rich_text: [{ type: 'text', text: { content: String(str).slice(0, 2000) } }] };
}

function toNotionTitle(str) {
  return { title: [{ type: 'text', text: { content: String(str).slice(0, 2000) } }] };
}

function toNotionNumber(num) {
  return { number: typeof num === 'number' ? num : (parseFloat(num) || null) };
}

function toNotionSelect(val) {
  return { select: { name: String(val) } };
}

function toNotionDate(dateStr) {
  return { date: { start: dateStr || new Date().toISOString() } };
}

export async function logTradeToNotion(trade) {
  const { dbId } = getConfig();

  const properties = {
    'Symbol': toNotionTitle(trade.symbol || 'UNKNOWN'),
    'Direction': toNotionSelect(trade.direction || ''),
    'Date': toNotionDate(trade.date),
  };

  if (trade.grade) properties['Grade'] = toNotionSelect(trade.grade);
  if (trade.win_probability != null) properties['Win Prob'] = toNotionNumber(trade.win_probability);
  if (trade.setup_type) properties['Setup Type'] = toNotionSelect(trade.setup_type);
  if (trade.entry_price != null) properties['Entry Price'] = toNotionNumber(trade.entry_price);
  if (trade.stop_loss != null) properties['Stop Loss'] = toNotionNumber(trade.stop_loss);
  if (trade.tp1 != null) properties['TP1'] = toNotionNumber(trade.tp1);
  if (trade.tp2 != null) properties['TP2'] = toNotionNumber(trade.tp2);
  if (trade.tp3 != null) properties['TP3'] = toNotionNumber(trade.tp3);
  if (trade.rr != null) properties['RR'] = toNotionNumber(trade.rr);
  if (trade.leverage != null) properties['Leverage'] = toNotionNumber(trade.leverage);
  if (trade.conviction) properties['Conviction'] = toNotionSelect(trade.conviction);
  if (trade.risk_pct != null) properties['Risk %'] = toNotionNumber(trade.risk_pct);
  if (trade.liquidity_quality) properties['Liquidity Quality'] = toNotionSelect(trade.liquidity_quality);
  if (trade.reasons && trade.reasons.length) properties['Reasons'] = toNotionText(trade.reasons.join('\n'));
  if (trade.notes) properties['Notes'] = toNotionText(trade.notes);

  const body = {
    parent: { database_id: dbId },
    properties,
  };

  if (trade.children && trade.children.length) {
    body.children = trade.children;
  }

  const result = await notionRequest('/pages', 'POST', body);
  return { success: true, page_id: result.id, url: result.url };
}

export async function updateTradeExit(pageId, exitData) {
  const properties = {};

  if (exitData.exit_price != null) properties['Exit Price'] = toNotionNumber(exitData.exit_price);
  if (exitData.pnl != null) properties['P&L'] = toNotionNumber(exitData.pnl);
  if (exitData.pnl_pct != null) properties['P&L %'] = toNotionNumber(exitData.pnl_pct);
  if (exitData.result) properties['Result'] = toNotionSelect(exitData.result);
  if (exitData.exit_reason) properties['Exit Reason'] = toNotionSelect(exitData.exit_reason);
  if (exitData.notes) properties['Notes'] = toNotionText(exitData.notes);

  const result = await notionRequest(`/pages/${pageId}`, 'PATCH', { properties });
  return { success: true, page_id: result.id };
}

export async function getTradeDbSchema() {
  const { dbId } = getConfig();
  const result = await notionRequest(`/databases/${dbId}`, 'GET');
  return {
    success: true,
    database_id: result.id,
    title: result.title?.map(t => t.plain_text).join('') || 'Untitled',
    properties: Object.entries(result.properties).map(([name, def]) => ({
      name,
      type: def.type,
    })),
  };
}
