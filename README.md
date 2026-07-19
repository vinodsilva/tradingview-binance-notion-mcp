# TradingView + Binance MCP

<div align="center">

**Connect any AI agent to your TradingView chart and Binance account** — 104 tools via the Model Context Protocol.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-6C47FF)](https://modelcontextprotocol.io)
[![macOS](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)](https://github.com/vinodsilva/tradingview-binance-notion-mcp)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](https://github.com/vinodsilva/tradingview-binance-notion-mcp/pulls)

</div>

---

## What is this?

An [MCP server](https://modelcontextprotocol.io) that bridges AI assistants to professional-grade trading infrastructure. Read live charts, execute trades, log to your journal, and send signals — all through natural language.

```
Claude Code / AI Agent ←→ MCP Server ←→ CDP ─── TradingView Desktop
                                       ←→ REST ── Binance (spot + futures)
                                       ←→ API ─── Telegram
                                       ←→ API ─── Notion
```

**No cloud. No data leaving your machine.** TradingView connects locally via Chrome DevTools Protocol. Binance API keys stay in `.env`. Every connection is direct and private.

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/vinodsilva/tradingview-binance-notion-mcp.git
cd tradingview-mcp
npm install

# 2. Launch TradingView with remote debugging
/Applications/TradingView.app/Contents/MacOS/TradingView --remote-debugging-port=9222

# 3. Add to your Claude Code config (~/.claude/.mcp.json)
{
  "mcpServers": {
    "tradingview": {
      "command": "node",
      "args": ["/path/to/tradingview-mcp/src/server.js"]
    }
  }
}
```

---

## Environment Setup

Create a `.env` file in the project root with your credentials:

```bash
# === BINANCE ===
BINANCE_API_KEY=your_api_key
BINANCE_API_SECRET=your_api_secret
BINANCE_TESTNET=true               # set false for mainnet
FUTURES_LEVERAGE=5
FUTURES_MARGIN_TYPE=CROSSED

# === TELEGRAM (optional — send signals) ===
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# === NOTION (optional — trade journal) ===
NOTION_API_KEY=your_notion_integration_token
NOTION_TRADE_DB_ID=your_trade_database_id
```

---

## Tool Reference

### Chart Reading
| Tool | Description |
|------|-------------|
| `chart_get_state` | Symbol, resolution, all indicators with entity IDs |
| `data_get_study_values` | Live readings from every visible indicator |
| `quote_get` | Real-time price: last, OHLC, volume |
| `data_get_ohlcv` | Price bars with `summary: true` for compact stats |
| `data_get_indicator` | Indicator info and input values by entity ID |
| `depth_get` | Full order book / DOM |
| `symbol_info` | Symbol metadata, exchange, type |
| `symbol_search` | Search by ticker or keyword |

### Custom Pine Indicator Data
Indicators drawn with `line.new()`, `label.new()`, `table.new()`, and `box.new()` are invisible to normal tools. Use these:
| Tool | Description |
|------|-------------|
| `data_get_pine_lines` | Horizontal price levels (deduplicated, sorted) |
| `data_get_pine_labels` | Text annotations with prices ("PDH 24550") |
| `data_get_pine_tables` | Formatted table rows (session stats, dashboards) |
| `data_get_pine_boxes` | Price zones as {high, low} pairs |

All support `study_filter` to target a specific indicator by name.

### Chart Control
| Tool | Description |
|------|-------------|
| `chart_set_symbol` | Switch ticker (BTCUSD, AAPL, ES1!, NYMEX:CL1!) |
| `chart_set_timeframe` | Change resolution (1, 5, 15, 60, D, W, M) |
| `chart_set_type` | Candles, HeikinAshi, Line, Renko, Kagi... |
| `chart_manage_indicator` | Add or remove indicators |
| `chart_scroll_to_date` | Jump to a specific date |
| `chart_set_visible_range` | Zoom to exact date range |
| `chart_get_visible_range` | Current visible date range |

### Pine Script Development
| Tool | Description |
|------|-------------|
| `pine_set_source` | Inject code into the editor |
| `pine_smart_compile` | Compile with auto-detection + error check |
| `pine_get_errors` | Read compilation errors |
| `pine_get_console` | Read `log.info()` output |
| `pine_get_source` | Read current Pine code back |
| `pine_compile` | Compile script |
| `pine_save` | Save to TradingView cloud |
| `pine_new` | Create blank indicator / strategy / library |
| `pine_open` | Load a saved script by name |
| `pine_list_scripts` | List all saved scripts |
| `pine_analyze` | Static analysis — catches bugs without compiling |
| `pine_check` | Server-side validation |

### Strategy Tester
| Tool | Description |
|------|-------------|
| `data_get_strategy_results` | Full performance metrics |
| `data_get_trades` | Trade list with entries and exits |
| `data_get_equity` | Equity curve data |

### Indicators
| Tool | Description |
|------|-------------|
| `indicator_set_inputs` | Change length, source, period, etc. |
| `indicator_toggle_visibility` | Show or hide an indicator |

### Replay Mode
Practice trade on historical data:
| Tool | Description |
|------|-------------|
| `replay_start` | Enter replay at a specific date |
| `replay_step` | Advance one bar |
| `replay_autoplay` | Auto-advance at configurable speed |
| `replay_trade` | Execute buy / sell / close |
| `replay_status` | Current position, P&L, date |
| `replay_stop` | Return to real-time |

### Drawings
| Tool | Description |
|------|-------------|
| `draw_shape` | Lines, rectangles, text annotations |
| `draw_forecast` | Projected trend with entry, targets, stop |
| `draw_position` | Full position: entry, SL, multiple targets |
| `draw_list` | List all drawings on chart |
| `draw_get_properties` | Details of a specific drawing |
| `draw_remove_one` | Remove by entity ID |
| `draw_clear` | Remove all drawings |

### Multi-Pane & Multi-Tab
| Tool | Description |
|------|-------------|
| `pane_list` | All panes with symbols and active state |
| `pane_set_layout` | Layout: s, 2h, 2v, 4 (2x2), 6, 8 |
| `pane_focus` | Focus pane by index |
| `pane_set_symbol` | Set symbol on specific pane |
| `tab_list` | All open chart tabs |
| `tab_new` | Open a new tab |
| `tab_close` | Close current tab |
| `tab_switch` | Switch to tab by index |

### Watchlist
| Tool | Description |
|------|-------------|
| `watchlist_get` | Symbols with last price, change, change% |
| `watchlist_add` | Add symbol to watchlist |

### Alerts
| Tool | Description |
|------|-------------|
| `alert_create` | Create price alert (crossing, above, below) |
| `alert_list` | View active alerts |
| `alert_delete` | Delete all alerts |

### Screenshots
| Tool | Description |
|------|-------------|
| `capture_screenshot` | Capture full UI, chart, or strategy tester |

### UI Automation
| Tool | Description |
|------|-------------|
| `ui_click` | Click by aria-label, text, or CSS |
| `ui_open_panel` | Open/close pine-editor, strategy-tester, watchlist, alerts, trading, replay |
| `ui_fullscreen` | Toggle fullscreen |
| `ui_keyboard` | Press keys or shortcuts (Enter, Ctrl+Z, etc.) |
| `ui_type_text` | Type into the focused element |
| `ui_hover` | Hover over an element |
| `ui_scroll` | Scroll up/down/left/right |
| `ui_mouse_click` | Click at exact x,y coordinates |
| `ui_find_element` | Find UI elements by text or selector |
| `ui_evaluate` | Execute arbitrary JavaScript in the page |
| `layout_list` | List saved chart layouts |
| `layout_switch` | Load a saved layout |
| `tv_ui_state` | Get panel visibility and button states |

### Batch Operations
| Tool | Description |
|------|-------------|
| `batch_run` | Run screenshot / OHLCV / strategy across multiple symbols + timeframes |

### Coin Scanner
| Tool | Description |
|------|-------------|
| `coin_scan` | Markov chain momentum scan — rank crypto by entropy + HTF alignment |

### Telegram
| Tool | Description |
|------|-------------|
| `telegram_send_message` | Send text report or signal (HTML supported) |
| `telegram_send_photo` | Send screenshot + trade analysis caption |

### Notion Trade Journal
| Tool | Description |
|------|-------------|
| `notion_log_trade` | Log trade entry with setup, levels, reasoning |
| `notion_update_exit` | Update exit price, P&L, and result |
| `notion_check_schema` | Verify your database columns match expectations |

### Connection
| Tool | Description |
|------|-------------|
| `tv_launch` | Auto-detect and launch TradingView with CDP |
| `tv_health_check` | Verify CDP connection and chart state |
| `tv_discover` | API endpoint discovery |

---

## Binance Integration (18 tools)

### Market Data
| Tool | Description |
|------|-------------|
| `get_price` | Current price for any symbol |
| `get_orderbook` | Order book depth (bids/asks) |
| `get_klines` | Candlestick data — all intervals 1m to 1M |
| `get_24hr_ticker` | 24-hour price change statistics |

### Account
| Tool | Description |
|------|-------------|
| `get_account_info` | Balances, commissions, permissions |

### Spot Trading
| Tool | Description |
|------|-------------|
| `get_open_orders` | Current open orders |
| `get_order_history` | Historical orders for a symbol |
| `place_order` | MARKET or LIMIT |
| `cancel_order` | Cancel by order ID |
| `cancel_all_orders` | Cancel all open orders for a symbol |

### Futures
| Tool | Description |
|------|-------------|
| `get_futures_account_info` | Wallet balance, margin, P&L |
| `get_futures_positions` | Active positions with liquidation risk |
| `get_futures_open_orders` | Open futures orders |
| `place_futures_order` | MARKET / LIMIT / STOP_MARKET / TAKE_PROFIT_MARKET |
| `cancel_futures_orders` | Cancel all orders for a symbol |
| `set_futures_leverage` | 1-125x |
| `set_futures_margin_type` | ISOLATED or CROSSED |
| `get_risk_config` | Position size limits, daily loss, max positions |

> **Conditional orders**: STOP_MARKET and TAKE_PROFIT_MARKET return `algoId` instead of `orderId`. The tool normalizes both. These orders are NOT visible via `get_futures_open_orders`.

**HARD RULE:** Every futures entry must set stop loss and take profit simultaneously. Split TP across 2 levels (50% each).

---

## Agents & Skills

The project ships with ready-made trading agents — role definitions that, when triggered, execute complete multi-step workflows.

| Agent | Trigger | What it does |
|-------|---------|-------------|
| **chart-analyst** | "Act as **chart-analyst** on ES1!" | 10-stage institutional pipeline: setup → volume → S/D → structure → fib → momentum → confluence → sizing → execution → report |
| **coin-scout** | "Act as **coin-scout**" | Markov chain MTF momentum scanner — screen top Binance coins, rank by entropy |
| **market-scanner** | "Act as **market-scanner**" | Iterative multi-market scan — cycles crypto → futures → stocks until grade A/B found |
| **performance-analyst** | "Act as **performance-analyst**" | Strategy backtest analysis — metrics, trade list, equity curve, recommendations |
| **replay-coach** | "Act as **replay-coach**" | Guide practice trading in replay: step bars, take trades, track P&L |
| **pine-coder** | "Act as **pine-coder**" | Full Pine Script dev loop: write → compile → fix → iterate |

### Full Chart Analysis Pipeline

The chart-analyst agent runs a complete institutional trading pipeline:

```
_setup → _volume → _supply_demand → _structure → _fib → _momentum → _confluence → _sizing → _execution → _report
```

Covers Wyckoff / VSA, order blocks, FVGs, Fibonacci OTE (0.618-0.786), liquidity theory, Elliott Wave, RSI/MACD divergence, EV-based confluence scoring, and automated chart annotation. Each module has a detailed reference in `skills/chart-analysis/`.

---

## Architecture

```
                    ┌─────────────────────────┐
                    │   Claude Code / AI Agent  │
                    └────────────┬────────────┘
                                 │ MCP stdio
                    ┌────────────▼────────────┐
                    │    tradingview-mcp       │
                    │   104 tools + 6 agents   │
                    └──────┬──────────┬──────┘
                           │          │
              ┌──────CDP───┤          ├──REST───┐
              │            │          │         │
     ┌────────▼─────┐     │          │  ┌──────▼──────┐
     │ TradingView   │     │          │  │   Binance    │
     │ Desktop       │     │          │  │ spot + fut   │
     │ (Electron)    │     │          │  └─────────────┘
     └───────────────┘     │          │
                           │          │
     ┌───────────────┐     │          │
     │ Telegram Bot  │◄────┘          │
     └───────────────┘                │
                                      │
     ┌───────────────┐                │
     │ Notion API    │◄───────────────┘
     │ Trade Journal │
     └───────────────┘
```

- **Transport**: MCP stdio protocol
- **TradingView**: Chrome DevTools Protocol (localhost:9222)
- **Binance**: REST API (spot + futures)
- **Telegram**: Bot API for signal distribution
- **Notion**: REST API for trade journaling
- **Dependencies**: `@modelcontextprotocol/sdk`, `chrome-remote-interface`, `binance-api-node`, `dotenv`
- **Platforms**: macOS, Windows, Linux

---

## Security

> [!CAUTION]
> CDP debug port (9222) is disabled by default — must be explicitly enabled with `--remote-debugging-port`. Never expose it to your network or the internet.

- All connections are localhost-only (TradingView) or direct API (Binance/Telegram/Notion)
- API keys stored in `.env`, never transmitted outside this process
- No data redistribution, no telemetry, no cloud processing
- You are in full control of every connection

See [SECURITY.md](SECURITY.md) for details.

---

## Contributing

Contributions welcome! Open an issue or submit a PR. Check the existing agent and skill files in `agents/` and `skills/` for conventions.

---

## Disclaimer

For **personal, educational, and research purposes only**. Not affiliated with TradingView Inc., Binance, Anthropic, Telegram, or Notion. Ensure compliance with [TradingView's Terms of Use](https://www.tradingview.com/policies/). CDP-based interaction may conflict with those terms — use responsibly.

---

## License

MIT — see [LICENSE](LICENSE). Covers project source code only, not third-party software, data, or trademarks.
