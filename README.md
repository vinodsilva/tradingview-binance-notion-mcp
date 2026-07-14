# TradingView + Binance MCP

> **Connect AI agents to your TradingView chart and Binance account** — 101 tools via the Model Context Protocol.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-6C47FF)](https://modelcontextprotocol.io)

---

## Overview

An [MCP server](https://modelcontextprotocol.io) that gives AI assistants access to two systems:

| Side | Connection | What you can do |
|------|-----------|-----------------|
| **TradingView** | CDP (localhost:9222) | Read charts, indicators, Pine Script drawings. Control symbol, timeframe, layout. Develop Pine Script. Practice with replay. |
| **Binance** | REST API | Market data (price, order book, klines). Spot trading (MARKET/LIMIT). Futures trading (leverage, margin, conditional orders, positions). |

```
Claude Code / AI Agent ←→ MCP Server (stdio) ←→ CDP ─── TradingView Desktop
                                                  ←→ REST ── Binance (spot + futures)
```

**All data stays on your machine.** The TradingView connection is purely local via Chrome DevTools Protocol. Binance API keys are stored in `.env` and never transmitted outside.

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/vinod99/tradingview-mcp.git
cd tradingview-mcp
npm install

# 2. Launch TradingView with Chrome DevTools Protocol
/Applications/TradingView.app/Contents/MacOS/TradingView --remote-debugging-port=9222

# 3. Add to Claude Code config (~/.claude/.mcp.json)
{
  "mcpServers": {
    "tradingview": {
      "command": "node",
      "args": ["/path/to/tradingview-mcp/src/server.js"]
    }
  }
}
```

### Binance Setup

```bash
# Add to .env in project root:
BINANCE_API_KEY=your_api_key
BINANCE_API_SECRET=your_api_secret
BINANCE_TESTNET=true       # false for mainnet
FUTURES_LEVERAGE=5
FUTURES_MARGIN_TYPE=CROSSED
```

### Telegram Setup (optional)

```bash
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

Then ask Claude: *"tv_health_check"*

---

## Tool Reference — TradingView (83 tools)

### Chart Reading
| Tool | Purpose |
|------|---------|
| `chart_get_state` | Symbol, timeframe, indicator names + entity IDs |
| `data_get_study_values` | RSI, MACD, BB, EMA values from all indicators |
| `quote_get` | Latest price, OHLC, volume |
| `data_get_ohlcv` | Price bars (use `summary: true`) |
| `depth_get` | Order book / DOM |
| `symbol_info` | Symbol metadata |

### Pine Script Drawings
| Tool | Purpose |
|------|---------|
| `data_get_pine_lines` | Horizontal price levels from indicators |
| `data_get_pine_labels` | Text annotations with prices |
| `data_get_pine_tables` | Formatted table data |
| `data_get_pine_boxes` | Price zones as `{high, low}` pairs |

### Chart Control
| Tool | Purpose |
|------|---------|
| `chart_set_symbol` | Change ticker |
| `chart_set_timeframe` | Change resolution |
| `chart_set_type` | Candles, HeikinAshi, Line, Renko... |
| `chart_manage_indicator` | Add/remove indicators |
| `chart_scroll_to_date` | Jump to date |
| `chart_set_visible_range` | Zoom to date range |
| `chart_get_visible_range` | Get visible range |
| `symbol_search` | Search symbols |

### Pine Script Development
| Tool | Purpose |
|------|---------|
| `pine_set_source` | Inject code |
| `pine_smart_compile` | Compile + error check |
| `pine_get_errors` | Read errors |
| `pine_get_console` | Read `log.info()` output |
| `pine_get_source` | Read current code |
| `pine_compile` | Compile script |
| `pine_save` | Save to cloud |
| `pine_new` | Create blank script |
| `pine_open` | Load saved script |
| `pine_list_scripts` | List saved scripts |
| `pine_analyze` | Static analysis (offline) |
| `pine_check` | Server-side validation |

### Strategy Tester
| Tool | Purpose |
|------|---------|
| `data_get_strategy_results` | Performance metrics |
| `data_get_trades` | Trade list |
| `data_get_equity` | Equity curve |

### Indicators
| Tool | Purpose |
|------|---------|
| `indicator_set_inputs` | Change indicator settings |
| `indicator_toggle_visibility` | Show/hide indicator |

### Multi-Pane
| Tool | Purpose |
|------|---------|
| `pane_list` | List panes with symbols |
| `pane_set_layout` | Grid: s, 2h, 2v, 4, 6, 8 |
| `pane_focus` | Focus pane by index |
| `pane_set_symbol` | Set symbol on pane |

### Multi-Tab
| Tool | Purpose |
|------|---------|
| `tab_list` | List open tabs |
| `tab_new` | New tab |
| `tab_close` | Close tab |
| `tab_switch` | Switch tab |

### Replay Mode
| Tool | Purpose |
|------|---------|
| `replay_start` | Enter replay |
| `replay_step` | Advance bar |
| `replay_autoplay` | Auto-play |
| `replay_trade` | Execute trade |
| `replay_status` | Position, P&L, date |
| `replay_stop` | Return to live |

### Drawings
| Tool | Purpose |
|------|---------|
| `draw_shape` | Lines, rectangles, text |
| `draw_forecast` | Projected trend + targets |
| `draw_position` | Position with SL/targets |
| `draw_list` | List drawings |
| `draw_get_properties` | Drawing details |
| `draw_remove_one` | Remove drawing |
| `draw_clear` | Remove all |

### Watchlist
| Tool | Purpose |
|------|---------|
| `watchlist_get` | List with prices + change% |
| `watchlist_add` | Add symbol |

### Alerts
| Tool | Purpose |
|------|---------|
| `alert_create` | Price alert |
| `alert_list` | Active alerts |
| `alert_delete` | Delete alerts |

### Screenshots
| Tool | Purpose |
|------|---------|
| `capture_screenshot` | Full, chart, or strategy_tester |

### UI Automation
| Tool | Purpose |
|------|---------|
| `ui_click` | Click by label/text/class |
| `ui_open_panel` | Open/close panels |
| `ui_fullscreen` | Toggle fullscreen |
| `ui_keyboard` | Press keys/shortcuts |
| `ui_type_text` | Type into focused element |
| `ui_hover` | Hover element |
| `ui_scroll` | Scroll page |
| `ui_mouse_click` | Click at coordinates |
| `ui_find_element` | Find by text/css |
| `ui_evaluate` | Execute JS in page |
| `layout_list` | Saved layouts |
| `layout_switch` | Switch layout |

### Batch
| Tool | Purpose |
|------|---------|
| `batch_run` | Run action across multiple symbols/timeframes |

### Coin Scanner
| Tool | Purpose |
|------|---------|
| `coin_scan` | Markov chain momentum scan |

### Telegram
| Tool | Purpose |
|------|---------|
| `telegram_send_message` | Send text |
| `telegram_send_photo` | Send screenshot + caption |

### Connection
| Tool | Purpose |
|------|---------|
| `tv_launch` | Auto-launch TV with CDP |
| `tv_health_check` | Verify connection |
| `tv_discover` | API endpoint discovery |
| `tv_ui_state` | UI panel state |

---

## Tool Reference — Binance (18 tools)

### Market Data
| Tool | Purpose |
|------|---------|
| `get_price` | Current price |
| `get_orderbook` | Order book depth |
| `get_klines` | Candlesticks (1m to 1M) |
| `get_24hr_ticker` | 24hr stats |

### Account
| Tool | Purpose |
|------|---------|
| `get_account_info` | Balances, permissions |

### Spot Orders
| Tool | Purpose |
|------|---------|
| `get_open_orders` | Open orders |
| `get_order_history` | Historical orders |
| `place_order` | MARKET or LIMIT |
| `cancel_order` | Cancel by ID |
| `cancel_all_orders` | Cancel all for symbol |

### Futures Account
| Tool | Purpose |
|------|---------|
| `get_futures_account_info` | Wallet, margin, P&L |
| `get_futures_positions` | Active positions |
| `get_futures_open_orders` | Open futures orders |

### Futures Orders
| Tool | Purpose |
|------|---------|
| `place_futures_order` | MARKET / LIMIT / STOP_MARKET / TAKE_PROFIT_MARKET |
| `cancel_futures_orders` | Cancel all for symbol |
| `set_futures_leverage` | Set 1-125x |
| `set_futures_margin_type` | ISOLATED or CROSSED |

### Risk
| Tool | Purpose |
|------|---------|
| `get_risk_config` | Position size, daily loss, max positions |

> **Conditional orders note:** STOP_MARKET and TAKE_PROFIT_MARKET return `algoId`/`algoStatus`/`triggerPrice` instead of `orderId`/`status`/`stopPrice`. The tool normalizes both. These orders are NOT visible via `get_futures_open_orders`.

---

## Architecture

```
                    ┌─────────────────────┐
                    │    Claude Code / AI   │
                    └──────────┬──────────┘
                               │ MCP stdio
                    ┌──────────▼──────────┐
                    │   tradingview-mcp    │
                    │    101 tools + CLI   │
                    └──────┬─────────┬────┘
                           │         │
              ┌──────CDP───┤         ├───REST────┐
              │            │         │           │
     ┌────────▼─────┐     │         │    ┌──────▼──────┐
     │ TradingView   │     │         │    │   Binance    │
     │ Desktop       │     │         │    │ fapi + api   │
     │ (Electron)    │     │         │    └─────────────┘
     └───────────────┘     │         │
                           │         │
     ┌───────────────┐     │         │
     │ Telegram Bot  │◄────┘         │
     └───────────────┘               │
                                     │
     ┌───────────────┐               │
     │ Coin Scanner  │◄──────────────┘
     │ (Markov Chain)│
     └───────────────┘
```

- **Transport**: MCP stdio + CLI (`tv` command)
- **TradingView**: CDP (localhost:9222) — chart, indicators, Pine Script, replay, drawings, UI automation
- **Binance**: REST API — market data, spot orders, futures (leverage, margin, conditional orders, positions)
- **Telegram**: Bot API — send messages and screenshots
- **Dependencies**: `@modelcontextprotocol/sdk`, `chrome-remote-interface`, `binance-api-node`, `dotenv`
- **Platform**: macOS, Windows, Linux

---

## Full Chart Analysis Pipeline

10-stage institutional pipeline triggered via the **chart-analyst** agent:

```
_setup → _volume → _supply_demand → _structure → _fib → _momentum → _confluence → _sizing → _execution → _report
```

Covers Wyckoff analysis, order blocks, FVGs, Fibonacci OTE zones, liquidity theory, divergence detection, EV-based confluence scoring, and position sizing. See `skills/chart-analysis/`. Trigger: *"Act as **chart-analyst** on ES1!"*

---

## Security

> [!CAUTION]
> CDP debug port (`9222`) is disabled by default — must be explicitly enabled. Never expose to network/internet.

- All connections are localhost-only (TradingView) or direct API (Binance)
- Binance API keys stored in `.env`, never transmitted externally
- No data redistribution or cloud processing

See [SECURITY.md](SECURITY.md).

---

## Disclaimer

For **personal, educational, and research purposes only**. Not affiliated with TradingView Inc., Binance, or Anthropic. Ensure compliance with [TradingView's Terms of Use](https://www.tradingview.com/policies/). CDP-based interaction may conflict with those terms.

---

## License

MIT — see [LICENSE](LICENSE). Covers project source code only, not third-party software, data, or trademarks.
