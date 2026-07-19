# Current Setup — Full Capabilities

104 tools across 4 integrated systems: **TradingView Desktop (CDP)** + **Binance (REST API)** + **Telegram** + **Notion Trade Journal**

---

## 📊 TradingView — Chart Intelligence

| Tool | What it does |
|------|-------------|
| `chart_get_state` | Read symbol, timeframe, all indicator names + entity IDs |
| `quote_get` | Latest price, OHLC, volume for any symbol |
| `data_get_ohlcv` | Price bars (summary or full), count up to 500 |
| `data_get_study_values` | Live RSI, MACD, BB, Volume, EMA — all indicators at once |
| `depth_get` | Order book / DOM depth |
| `symbol_info` | Symbol metadata (exchange, type, description) |
| `symbol_search` | Search tickers by keyword |

### Pine Script Drawings
| Tool | What it reads |
|------|-------------|
| `data_get_pine_lines` | Horizontal S/R levels from custom indicators |
| `data_get_pine_labels` | Text annotations with prices |
| `data_get_pine_tables` | Formatted table data (session stats, analytics) |
| `data_get_pine_boxes` | Price zones as {high, low} pairs |

---

## 🎮 TradingView — Control

### Chart
- Change symbol, timeframe, chart type (Candles, HeikinAshi, Renko, Line, Area, etc.)
- Add/remove any indicator (use full names)
- Scroll to any date, zoom to exact date range
- Search symbols

### Multi-Pane
- Layouts: single, 2h, 2v, 2+1, 1+2, 3, 4, 6, 8
- Set different symbols per pane, focus any pane

### Multi-Tab
- Open, close, switch between chart tabs
- List all open tabs

### Watchlist
- List all watchlist symbols with current price and change%
- Add symbols to watchlist

### Drawings
- Draw shapes: horizontal/trend lines, rectangles, text
- Draw positions with entry, SL, and targets
- Draw forecast projections with targets
- List, inspect, remove drawings

### Alerts
- Create price alerts (crossing, greater/less than)
- List and delete alerts

### Screenshots
- Capture full window, chart area, or strategy tester

### UI Automation
- Click elements by aria-label, text, or CSS
- Open/close panels (pine editor, strategy tester, watchlist, alerts, trading)
- Toggle fullscreen, press keyboard shortcuts
- Type text, hover, scroll, click at coordinates
- Find elements on screen
- Execute arbitrary JS in the page context
- List and switch saved layouts

---

## 🧪 Pine Script Development

| Step | Tool |
|------|------|
| Create script | `pine_new` (indicator/strategy/library) |
| Inject code | `pine_set_source` |
| Compile | `pine_smart_compile` (auto-detect + error check) |
| Read errors | `pine_get_errors` |
| Read console | `pine_get_console` |
| Read code | `pine_get_source` |
| Save | `pine_save` |
| Open saved | `pine_open` |
| List saved | `pine_list_scripts` |
| Static analysis | `pine_analyze` (offline, no chart needed) |
| Server validation | `pine_check` (no chart needed) |

---

## 🎯 Chart Analysis Pipeline (chart-analyst agent)

10-stage institutional workflow:

```
_setup → _volume → _supply_demand → _structure → _fib → _momentum → _confluence → _sizing → _execution → _report
```

- Wyckoff phase detection, order blocks, FVGs
- Fibonacci OTE zones, liquidity sweeps
- Divergence detection (RSI/MACD)
- EV-based confluence scoring
- Position sizing with risk management
- Full trade report with SL/TP levels and R:R

Trigger: *"Act as **chart-analyst** on BTCUSD"*

### Indicator Data
| Tool | What it does |
|------|-------------|
| `data_get_indicator` | Get study/indicator info and input values |

### Strategy Tester
- Read backtest metrics, trade list, equity curve from any strategy

---

## 🪙 Coin Scanner

- Markov chain MTF momentum analysis
- Screen top Binance USDT pairs by volume
- Rank by entropy + HTF alignment
- Returns top N candidates with grades

---

## 🔄 Binance — Market Data (4 tools)

| Tool | What it does |
|------|-------------|
| `get_price` | Current price for any symbol |
| `get_orderbook` | Order book depth (bids/asks) |
| `get_klines` | Candlestick data — all intervals: 1m to 1M |
| `get_24hr_ticker` | 24hr price change statistics |

---

## 🔄 Binance — Spot Trading (5 tools)

- Check account balances and permissions
- View open/historical orders
- Place MARKET or LIMIT orders
- Cancel by order ID or cancel all for a symbol

---

## 🔄 Binance — Futures Trading (7 tools)

### Account & Positions
- Wallet balance, margin, P&L
- Active positions with entry price, size, leverage
- Open orders list

### Orders
- MARKET / LIMIT entries
- STOP_MARKET for stop loss
- TAKE_PROFIT_MARKET for take profit
- Cancel all orders for a symbol

### Risk Management
- Set leverage (1-125x)
- Set margin type (ISOLATED or CROSSED)
- Risk config: max position size, max risk per trade, max daily loss, max open positions

> **Conditional orders note:** STOP_MARKET and TAKE_PROFIT_MARKET use `algoId`/`algoStatus`/`triggerPrice` instead of `orderId`/`status`/`stopPrice`. The tool normalizes both response shapes. These orders are NOT visible via `get_futures_open_orders`.

---

## 🎮 Replay Practice

- Enter replay mode at any date
- Step forward bar by bar
- Auto-play with configurable speed
- Execute buy/sell/close trades
- Track position, P&L, current replay date
- Return to live mode

---

## 📤 Telegram Integration

- Send text messages (HTML or Markdown formatting)
- Send chart screenshots with trade reasoning captions
- Multiple group/channel support via comma-separated chat IDs

---

## 🖥️ CLI (`tv` command)

Every MCP tool accessible as a CLI command:

```bash
tv status          # check connection
tv quote           # current price
tv symbol AAPL     # change symbol
tv ohlcv --summary # price summary
tv screenshot -r chart  # capture chart
tv pane layout 2x2 # 4-chart grid
```

## 📓 Notion Trade Journal

- Log trade entries with setup, levels, Conviction, Grade
- Update exits with P&L and result
- Check database schema compatibility before logging

---

## 🏗 Architecture

```
Claude Code / AI Agent ←→ MCP Server (stdio) ←→ CDP ─── TradingView Desktop (Electron)
                                                 ←→ REST ── Binance (api + fapi)
                                                 ←→ Telegram Bot API
                                                 ←→ Notion REST API
```

- **Transport**: MCP stdio protocol
- **TradingView**: Chrome DevTools Protocol (localhost:9222)
- **Binance**: REST API — api.binance.com (spot) + fapi.binance.com (futures)
- **Telegram**: Bot API
- **Notion**: REST API for trade journaling
- **Dependencies**: `@modelcontextprotocol/sdk`, `chrome-remote-interface`, `binance-api-node`, `dotenv`

---
