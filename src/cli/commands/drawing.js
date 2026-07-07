import { register } from '../router.js';
import * as core from '../../core/drawing.js';

register('draw', {
  description: 'Drawing tools (shape, list, get, remove, clear)',
  subcommands: new Map([
    ['shape', {
      description: 'Draw a shape on the chart',
      options: {
        type: { type: 'string', short: 't', description: 'Shape type: horizontal_line, trend_line, rectangle, text' },
        price: { type: 'string', short: 'p', description: 'Price level' },
        time: { type: 'string', description: 'Unix timestamp' },
        price2: { type: 'string', description: 'Second point price (for trend_line, rectangle)' },
        time2: { type: 'string', description: 'Second point time (for trend_line, rectangle)' },
        text: { type: 'string', description: 'Text content (for text shapes)' },
        overrides: { type: 'string', description: 'JSON style overrides' },
      },
      handler: (opts) => {
        const point = { time: Number(opts.time), price: Number(opts.price) };
        const point2 = opts.price2 ? { time: Number(opts.time2), price: Number(opts.price2) } : undefined;
        return core.drawShape({ shape: opts.type || 'horizontal_line', point, point2, overrides: opts.overrides, text: opts.text });
      },
    }],
    ['list', {
      description: 'List all drawings on the chart',
      handler: () => core.listDrawings(),
    }],
    ['get', {
      description: 'Get properties of a drawing',
      handler: (opts, positionals) => core.getProperties({ entity_id: positionals[0] }),
    }],
    ['remove', {
      description: 'Remove a drawing by entity ID',
      handler: (opts, positionals) => core.removeOne({ entity_id: positionals[0] }),
    }],
    ['position', {
      description: 'Draw Long/Short Position with entry, SL, and targets',
      options: {
        direction: { type: 'string', short: 'd', description: 'Direction: long or short' },
        entry_time: { type: 'string', short: 't', description: 'Entry time (unix timestamp)' },
        entry_price: { type: 'string', short: 'p', description: 'Entry price' },
        stop_loss: { type: 'string', short: 's', description: 'Stop loss price' },
        targets: { type: 'string', description: 'Comma-separated target prices (e.g. "1.05,1.06,1.07")' },
        text: { type: 'string', description: 'Position label text' },
        quantity: { type: 'string', description: 'Position quantity (default 1)' },
      },
      handler: (opts) => {
        const targets = opts.targets ? opts.targets.split(',').map(p => ({ price: Number(p.trim()) })) : [];
        return core.drawPosition({
          direction: opts.direction || 'long',
          entry_time: Number(opts.entry_time),
          entry_price: Number(opts.entry_price),
          stop_loss: Number(opts.stop_loss),
          targets,
          text: opts.text,
          quantity: opts.quantity ? Number(opts.quantity) : undefined,
        });
      },
    }],
    ['clear', {
      description: 'Remove all drawings',
      handler: () => core.clearAll(),
    }],
  ]),
});
