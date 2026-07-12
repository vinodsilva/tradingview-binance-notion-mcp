# TradingView MCP Bridge

> **Connect AI agents to your TradingView Desktop chart** — 78 tools for reading, analyzing, and controlling your locally running TradingView app via the Model Context Protocol.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-6C47FF)](https://modelcontextprotocol.io)

---

## Overview

TradingView MCP Bridge is an [MCP server](https://modelcontextprotocol.io) that gives AI assistants eyes and hands on your TradingView Desktop chart. It bridges the gap between LLM agents and professional-grade charting software — enabling AI-assisted chart analysis, Pine Script development, multi-timeframe workflows, and replay-based practice trading.

```
Claude Code / AI Agent  ←→  MCP Server (stdio)  ←→  CDP (localhost:9222)  ←→  TradingView Desktop (Electron)
```

**All data stays on your machine.** The server communicates exclusively with your locally running TradingView Desktop instance via Chrome DevTools Protocol (CDP) — a standard debugging interface built into every Chromium/Electron application. No connection to external servers, no data redistribution, no cloud processing.

---

## Features

### 📊 Chart Intelligence
- Read real-time quotes, OHLCV data, and indicator values (RSI, MACD, Bollinger Bands, Volume, etc.)
- Extract support/resistance levels, zone boundaries, and annotations from Pine Script indicators
- Read structured tables and labels from custom indicators (session stats, analytics dashboards)

### 🧩 Multi-Timeframe Analysis
- Automated 10-stage institutional analysis pipeline: setup → volume → structure → confluence → sizing → execution → reporting
- Wyckoff phase detection, order blocks, FVGs, Fibonacci OTE zones, liquidity sweeps
- Supply/demand zone mapping, Elliott Wave overlays, divergence detection

### 🧪 Pine Script Development
- Full compile-error-fix loop: write code, inject into editor, compile, read errors, iterate
- Offline static analysis — catches array bounds, unguarded calls, and logic bugs before compiling
- Server-side compilation validation without needing the chart open

### 🎯 Precision Execution
- Solid Anchor Model — place limit entries at structural levels (order blocks, FVGs, S/D zones, OTE 0.705)
- Let price come to you instead of chasing: structural stop placement, target derivation from liquidity pools
- Full auto-drawing with entry, stop, targets, sweep levels, zone rectangles, and forecast projection on clean chart

### 📐 Multi-Pane & Multi-Tab
- Set up grids (2×2, 3×1, 2+1, 6, 8) with different symbols per pane
- Manage multiple chart tabs, switch between saved layouts
- Monitor symbols simultaneously across panes

### 🎮 Replay Practice
- Step through historical bars, execute simulated trades, practice entries and exits
- Auto-play mode with configurable speed for timed practice sessions

### 🖥️ CLI
- Every MCP tool is also a `tv` CLI command with JSON output for piping
- Streaming commands for real-time monitoring: quotes, bars, indicator values, price levels

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/<your-username>/tradingview-mcp.git
cd tradingview-mcp
npm install

# 2. Launch TradingView with Chrome DevTools Protocol enabled
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

Then ask Claude: *"Use tv_health_check to verify TradingView is connected."*

---

## Tool Reference

### Chart Reading
| Tool | Purpose |
|------|---------|
| `chart_get_state` | Get symbol, timeframe, all indicator names + entity IDs |
| `data_get_study_values` | Read current RSI, MACD, BB, EMA values from all indicators |
| `quote_get` | Get latest price, OHLC, volume |
| `data_get_ohlcv` | Get price bars (use `summary: true` for compact stats) |

### Custom Indicator Data (Pine Drawings)
| Tool | Purpose |
|------|---------|
| `data_get_pine_lines` | Read deduplicated horizontal price levels (S/R, session levels) |
| `data_get_pine_labels` | Read text annotations with prices ("PDH 24550", "Bias Long ✓") |
| `data_get_pine_tables` | Read formatted table data (session stats, analytics) |
| `data_get_pine_boxes` | Read price zones as `{high, low}` pairs |

### Chart Control
| Tool | Purpose |
|------|---------|
| `chart_set_symbol` | Change ticker (BTCUSD, AAPL, ES1!) |
| `chart_set_timeframe` | Change resolution (1, 5, 15, 60, D, W) |
| `chart_set_type` | Change style (Candles, HeikinAshi, Line, Area, Renko) |
| `chart_manage_indicator` | Add/remove indicators |
| `chart_scroll_to_date` | Jump to a date |
| `indicator_set_inputs` | Change indicator settings |

### Pine Script Development
| Step | Tool |
|------|------|
| Inject code | `pine_set_source` |
| Compile | `pine_smart_compile` |
| Read errors | `pine_get_errors` |
| Read console | `pine_get_console` |
| Validate offline | `pine_analyze` (no chart needed) |
| Validate server-side | `pine_check` (no chart needed) |

### Multi-Pane Layouts
| Tool | Purpose |
|------|---------|
| `pane_list` | List all panes with symbols |
| `pane_set_layout` | Change grid: `s`, `2h`, `2v`, `4`, `6`, `8` |
| `pane_focus` | Focus a specific pane |
| `pane_set_symbol` | Set symbol on any pane |

### Replay Mode
| Step | Tool |
|------|------|
| Enter replay | `replay_start` |
| Advance bar | `replay_step` |
| Trade | `replay_trade` |
| Check status | `replay_status` |
| Return to live | `replay_stop` |

### Drawing & Automation
| Tool | Purpose |
|------|---------|
| `draw_shape` | Draw lines, rectangles, text on chart |
| `draw_forecast` | Draw projected trend with targets |
| `draw_position` | Draw long/short position with SL and targets |
| `capture_screenshot` | Screenshot (full, chart, strategy_tester) |
| `alert_create / list / delete` | Manage price alerts |
| `batch_run` | Execute across multiple symbols/timeframes |
| `ui_open_panel / ui_click / ui_evaluate` | UI automation |

### Connection & Diagnostics
| Tool | Purpose |
|------|---------|
| `tv_launch` | Auto-detect and launch TradingView with CDP |
| `tv_health_check` | Verify CDP connection and chart state |
| `tv_discover` | Report available API endpoints |
| `tv_ui_state` | Get current UI panel state |

---

## Full Chart Analysis Pipeline

The project includes a complete institutional-grade chart analysis framework organized as a 10-stage pipeline:

```
_setup → _volume → _supply_demand → _structure → _fib → _momentum → _confluence → _sizing → _execution → _report
```

Each module is a pure function — takes structured input from the previous stage, computes one thing, passes output forward. The pipeline covers Wyckoff analysis, order blocks, FVGs, Fibonacci OTE zones, liquidity theory, divergence detection, EV-based confluence scoring, and position sizing. See `skills/chart-analysis/` for the full specification.

---

## CLI

Every MCP tool is accessible as a `tv` CLI command with JSON output:

```bash
npm link    # install globally
tv status   # check connection
tv quote    # current price
tv symbol AAPL    # change symbol
tv ohlcv --summary # price summary
tv screenshot -r chart   # capture chart
tv pane layout 2x2    # 4-chart grid
tv stream quote | jq '.close'   # monitor price
```

---

## Architecture

```
                    ┌─────────────────────┐
                    │   Claude Code / AI   │
                    └──────────┬──────────┘
                               │ MCP (stdio)
                    ┌──────────▼──────────┐
                    │   tradingview-mcp    │
                    │    MCP Server         │
                    │  (78 tools, 30 CLI)   │
                    └──────────┬──────────┘
                               │ CDP (localhost:9222)
                    ┌──────────▼──────────┐
                    │  TradingView Desktop │
                    │    (Electron app)     │
                    └─────────────────────┘
```

- **Transport**: MCP over stdio (78 tools) + CLI (`tv` command)
- **Connection**: Chrome DevTools Protocol on localhost:9222
- **Dependencies**: `@modelcontextprotocol/sdk`, `chrome-remote-interface`
- **Platform**: macOS, Windows, Linux

---

## Security

> [!CAUTION]
> This tool uses Chrome DevTools Protocol (CDP), the same debugging interface used by VS Code, Slack, and Discord. The debug port (`9222`) must be explicitly enabled — it is disabled by default. Never expose this port to your network or the internet.

- All communication is localhost-only
- No data is transmitted, stored, or redistributed externally
- Requires a valid TradingView subscription — does not bypass any paywall
- Requires explicit user action to enable the debug port

See [SECURITY.md](SECURITY.md) for the full security policy.

---

## Disclaimer

This project is for **personal, educational, and research purposes only**. It is not affiliated with, endorsed by, or associated with TradingView Inc. or Anthropic.

By using this software, you acknowledge:
1. You are solely responsible for ensuring compliance with [TradingView's Terms of Use](https://www.tradingview.com/policies/)
2. TradingView's terms restrict automated interaction with their platform — this tool's use of CDP may conflict
3. This tool accesses undocumented internal TradingView interfaces that may break without notice
4. You assume all risk of use

---

## License

MIT — see [LICENSE](LICENSE).

The MIT license applies to the source code of this project only. It does not grant any rights to TradingView's software, data, trademarks, or intellectual property.
