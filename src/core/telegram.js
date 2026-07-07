import { readFileSync } from 'fs';

const API_BASE = 'https://api.telegram.org/bot';

function getConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = process.env.TELEGRAM_CHAT_ID;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN env var not set');
  if (!chatIds) throw new Error('TELEGRAM_CHAT_ID env var not set (comma-separated for multiple)');
  return { token, chatIds: chatIds.split(',').map(s => s.trim()) };
}

export async function sendTelegramMessage({ text, parse_mode = 'HTML' } = {}) {
  const { token, chatIds } = getConfig();
  const results = [];
  for (const chat_id of chatIds) {
    const res = await fetch(`${API_BASE}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text, parse_mode }),
    });
    const json = await res.json();
    results.push({ chat_id, ok: json.ok, description: json.description || null });
  }
  return { success: results.every(r => r.ok), results };
}

export async function sendTelegramPhoto({ photo_path, caption, parse_mode = 'HTML' } = {}) {
  const { token, chatIds } = getConfig();
  const results = [];
  for (const chat_id of chatIds) {
    const formData = new FormData();
    const blob = new Blob([readFileSync(photo_path)], { type: 'image/png' });
    formData.append('photo', blob, 'chart.png');
    formData.append('chat_id', chat_id);
    if (caption) formData.append('caption', caption);
    if (parse_mode) formData.append('parse_mode', parse_mode);

    const res = await fetch(`${API_BASE}${token}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();
    results.push({ chat_id, ok: json.ok, description: json.description || null });
  }
  return { success: results.every(r => r.ok), results };
}
