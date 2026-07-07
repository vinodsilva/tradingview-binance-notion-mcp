import { z } from 'zod';
import { jsonResult } from './_format.js';
import * as core from '../core/telegram.js';

export function registerTelegramTools(server) {
  server.tool('telegram_send_message', 'Send a text message to Telegram group/channel', {
    text: z.string().describe('Message text (HTML parse_mode by default)'),
    parse_mode: z.string().optional().describe('Parse mode: HTML, MarkdownV2, or plain (default HTML)'),
  }, async ({ text, parse_mode }) => {
    try { return jsonResult(await core.sendTelegramMessage({ text, parse_mode })); }
    catch (err) { return jsonResult({ success: false, error: err.message }, true); }
  });

  server.tool('telegram_send_photo', 'Send a chart screenshot with trade reasoning to Telegram group/channel', {
    photo_path: z.string().describe('Absolute path to the screenshot PNG file'),
    caption: z.string().optional().describe('Caption text (HTML parse_mode by default)'),
    parse_mode: z.string().optional().describe('Parse mode: HTML, MarkdownV2, or plain (default HTML)'),
  }, async ({ photo_path, caption, parse_mode }) => {
    try { return jsonResult(await core.sendTelegramPhoto({ photo_path, caption, parse_mode })); }
    catch (err) { return jsonResult({ success: false, error: err.message }, true); }
  });
}
