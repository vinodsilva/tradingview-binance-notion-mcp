import { register } from '../router.js';
import * as core from '../../core/telegram.js';

register('telegram', {
  description: 'Send messages and photos to Telegram',
  subcommands: new Map([
    ['message', {
      description: 'Send a text message',
      options: {
        text: { type: 'string', short: 't', description: 'Message text (HTML)' },
        parse: { type: 'string', description: 'Parse mode: HTML, MarkdownV2, or plain' },
      },
      handler: (opts) => core.sendTelegramMessage({ text: opts.text, parse_mode: opts.parse }),
    }],
    ['photo', {
      description: 'Send a photo with caption',
      options: {
        photo: { type: 'string', short: 'p', description: 'Path to screenshot PNG' },
        caption: { type: 'string', short: 'c', description: 'Caption text (HTML)' },
        parse: { type: 'string', description: 'Parse mode: HTML, MarkdownV2, or plain' },
      },
      handler: (opts) => core.sendTelegramPhoto({ photo_path: opts.photo, caption: opts.caption, parse_mode: opts.parse }),
    }],
  ]),
});
