# TradingView MCP — Claude Instructions

104 tools for reading and controlling a live TradingView Desktop chart via CDP (port 9222), plus Telegram notification tools and Binance trading.

## Decision Tree — Which Tool When

### "What's on my chart right now?"
1. `chart_get_state` → symbol, timeframe, chart type, list of all indicators with entity IDs
2. `data_get_study_values` → current numeric values from all visible indicators (RSI, Volume, Mxwll, etc.)
3. `quote_get` → real-time price, OHLC, volume for current symbol

### "What levels/lines/labels are showing?"
Custom Pine indicators draw with `line.new()`, `label.new()`, `table.new()`, `box.new()`. These are invisible to normal data tools. Use:

1. `data_get_pine_lines` → horizontal price levels drawn by indicators (deduplicated, sorted high→low)
2. `data_get_pine_labels` → text annotations with prices (e.g., "PDH 24550", "Bias Long ✓")
3. `data_get_pine_tables` → table data formatted as rows (e.g., session stats, analytics dashboards)
4. `data_get_pine_boxes` → price zones / ranges as {high, low} pairs

Use `study_filter` parameter to target a specific indicator by name substring (e.g., `study_filter: "Profiler"`).

### "Give me price data"
- `data_get_ohlcv` with `summary: true` → compact stats (high, low, range, change%, avg volume, last 5 bars)
- `data_get_ohlcv` without summary → all bars (use `count` to limit, default 100)
- `quote_get` → single latest price snapshot

### "Analyze my chart" (quick report)
1. `quote_get` → current price
2. `data_get_study_values` → all indicator readings
3. `data_get_pine_lines` → key price levels from custom indicators
4. `data_get_pine_labels` → labeled levels with context (e.g., "Settlement", "ASN O/U")
5. `data_get_pine_tables` → session stats, analytics tables
6. `data_get_ohlcv` with `summary: true` → price action summary
7. `capture_screenshot` → visual confirmation

### "Full trading analysis" (chart-analysis workflow)
Act as **chart-analyst** to run the complete 10-stage pipeline: _setup → _volume → _supply_demand → _structure → _fib → _momentum → _confluence → _sizing → _execution → _report.

**Trigger phrases:**
- "Act as **chart-analyst** and analyze ES1!"
- "run full analysis on the current chart"
- "full chart analysis on BTCUSD"

Read `skills/chart-analysis/SKILL.md` and follow it step by step. This is the primary workflow for any directional trade decision. Each pipeline module has a separate reference file in `skills/chart-analysis/_*.md`.

### "Run an agent" (role-based execution)
Agents (`agents/`) are role definitions — they tell me *who to be* and *what tools to use*. Skills (`skills/`) are the detailed *how-to* reference. Each agent maps to exactly one skill:

| Trigger phrase | Agent | Skill | Purpose |
|---------------|-------|-------|---------|
| "Act as **chart-analyst** on ES1!" | [`agents/chart-analyst.md`](agents/chart-analyst.md) | [`skills/chart-analysis/SKILL.md`](skills/chart-analysis/SKILL.md) | 10-stage institutional pipeline: setup → volume → structure → fib → momentum → confluence → sizing → execution → report |
| "Act as **coin-scout** on Binance" | [`agents/coin-selection.md`](agents/coin-selection.md) | [`skills/coin-selection/SKILL.md`](skills/coin-selection/SKILL.md) | 3-TF StochRSI scanner — overbought/oversold + hidden divergence on 1H, 4H, D |
| "Act as **market-scanner** on NQ, ES, YM" | [`agents/market-scanner.md`](agents/market-scanner.md) | [`skills/multi-symbol-scan/SKILL.md`](skills/multi-symbol-scan/SKILL.md) | Iterative multi-market scan — cycles crypto → futures → stocks until grade A/B found |
| "Act as **performance-analyst**" | [`agents/performance-analyst.md`](agents/performance-analyst.md) | [`skills/strategy-report/SKILL.md`](skills/strategy-report/SKILL.md) | Strategy backtest analysis: metrics, trade list, equity curve, recommendations |
| "Act as **replay-coach**" | [`agents/replay-coach.md`](agents/replay-coach.md) | [`skills/replay-practice/SKILL.md`](skills/replay-practice/SKILL.md) | Guide practice trading in replay mode: step bars, take trades, track P&L |
| "Act as **pine-coder**" | [`agents/pine-coder.md`](agents/pine-coder.md) | [`skills/pine-develop/SKILL.md`](skills/pine-develop/SKILL.md) | Pine Script dev loop: write → compile → fix errors → iterate |

**Agent hierarchy:** Market-scanner and coin-scout both feed into chart-analyst for final grading. The chart-analyst pipeline is the single source of truth for directional trade decisions. All other agents are discovery or support layers.

### "Change the chart"
- `chart_set_symbol` → switch ticker (e.g., "AAPL", "ES1!", "NYMEX:CL1!")
- `chart_set_timeframe` → switch resolution (e.g., "1", "5", "15", "60", "D", "W")
- `chart_set_type` → switch chart style (Candles, HeikinAshi, Line, Area, Renko, etc.)
- `chart_manage_indicator` → add or remove studies (use full name: "Relative Strength Index", not "RSI")
- `chart_scroll_to_date` → jump to a date (ISO format: "2025-01-15")
- `chart_set_visible_range` → zoom to exact date range (unix timestamps)
- `chart_get_visible_range` → current visible date range

### "Work on Pine Script"
1. `pine_set_source` → inject code into editor
2. `pine_smart_compile` → compile with auto-detection + error check
3. `pine_get_errors` → read compilation errors
4. `pine_get_console` → read log.info() output
5. `pine_get_source` → read current code back (WARNING: can be very large for complex scripts)
6. `pine_save` → save to TradingView cloud
7. `pine_new` → create blank indicator/strategy/library
8. `pine_open` → load a saved script by name
9. `pine_list_scripts` → list all saved scripts
10. `pine_analyze` → static analysis (catches bugs without compiling)
11. `pine_check` → server-side validation (no chart needed)

### "Practice trading with replay"
1. `replay_start` with `date: "2025-03-01"` → enter replay mode
2. `replay_step` → advance one bar
3. `replay_autoplay` → auto-advance (set speed with `speed` param in ms)
4. `replay_trade` with `action: "buy"/"sell"/"close"` → execute trades
5. `replay_status` → check position, P&L, current date
6. `replay_stop` → return to realtime

### "Screen multiple symbols"
- `batch_run` with `symbols: ["ES1!", "NQ1!", "YM1!"]` and `action: "screenshot"` or `"get_ohlcv"`

### "Scan crypto coins for momentum"
Use the **coin-selection** workflow with **3-TF StochRSI** (replaces Markov scanner):
1. Fetch top Binance USDT pairs by volume (via `bash scripts/coin-stochrsi-scan.sh` or curl)
2. Run `coin_scan_stochrsi(timeframes: ["60", "240", "D"], volume_min: 5, top_n: 10)` for StochRSI overbought/oversold + hidden divergence analysis
3. Filter by score (> 60 strong, 30-60 moderate, < 30 skip)
4. Pass top candidates to chart-analyst for full pipeline grading

See `skills/coin-selection/SKILL.md` and `agents/coin-selection.md` for full details.

### "Draw on the chart"
- `draw_shape` → horizontal_line, trend_line, rectangle, text (pass point + optional point2)
- `draw_list` → see what's drawn
- `draw_remove_one` → remove by ID
- `draw_clear` → remove all
- `draw_forecast` → projected trend with entry, targets, stop
- `draw_position` → full position with entry, SL, multiple targets
- `draw_get_properties` → details of a specific drawing

### "Manage alerts"
- `alert_create` → set price alert (condition: "crossing", "greater_than", "less_than")
- `alert_list` → view active alerts
- `alert_delete` → remove alerts

### "Send updates to Telegram"
Requires `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` env vars.
- `telegram_send_message` → send a text report/analysis to Telegram
- `telegram_send_photo` → send screenshot + trade reasoning as photo with caption
- Use after `capture_screenshot` to share chart analysis to your group/channel

### "Log trades to Notion journal"
Requires `NOTION_API_KEY` and `NOTION_TRADE_DB_ID` env vars.
- `notion_log_trade` → log an executed trade entry to the Notion trade journal
- `notion_update_exit` → update a trade log with exit price/P&L when closed
- `notion_check_schema` → verify your Notion database columns match expectations
- See `skills/chart-analysis/_report.md` section 16 for the full workflow and required DB schema

### "Navigate the UI"
- `ui_open_panel` → open/close pine-editor, strategy-tester, watchlist, alerts, trading
- `ui_click` → click buttons by aria-label, text, or data-name
- `layout_switch` → load a saved layout by name
- `ui_fullscreen` → toggle fullscreen
- `capture_screenshot` → take a screenshot (regions: "full", "chart", "strategy_tester")

### "TradingView isn't running"
- `tv_launch` → auto-detect and launch TradingView with CDP on Mac/Win/Linux
- `tv_health_check` → verify connection is working
- `tv_discover` → API endpoint discovery
- `tv_ui_state` → panel visibility and button states

### "Work with Binance" (market data & trading)
Requires `BINANCE_API_KEY` and `BINANCE_API_SECRET` in `.env`. Set `BINANCE_TESTNET=true` for testnet.

**Market Data:**
- `get_price` → current price for a symbol (e.g., BTCUSDT)
- `get_orderbook` → order book depth (bids/asks)
- `get_klines` → candlestick data (all intervals: 1m to 1M)
- `get_24hr_ticker` → 24hr price change statistics

**Account & Orders:**
- `get_account_info` → balances, commissions, permissions
- `get_open_orders` → current open orders (optionally filtered by symbol)
- `get_order_history` → historical orders for a symbol

**Spot Trading:**
- `place_order` → MARKET or LIMIT orders (warns on mainnet)
- `cancel_order` → cancel by order ID
- `cancel_all_orders` → cancel all open orders for a symbol

**Futures:**
- `get_futures_account_info` → wallet balance, margin, P&L
- `get_futures_positions` → active positions with liquidation risk
- `get_futures_open_orders` → open futures orders
- `place_futures_order` → MARKET/LIMIT/STOP_MARKET/TAKE_PROFIT_MARKET orders
- `cancel_futures_orders` → cancel all orders for a symbol
- `set_futures_leverage` → set leverage (1-125x)
- `set_futures_margin_type` → ISOLATED or CROSSED

**Risk Management:**
- `get_risk_config` → current risk limits (position size, daily loss, max positions)

> **API note:** Binance conditional orders (STOP_MARKET, TAKE_PROFIT_MARKET) return `algoId`/`algoStatus`/`triggerPrice` in their response instead of `orderId`/`status`/`stopPrice`. The tool normalizes these — check the `orderId` field (it will contain the `algoId` value for conditional orders). Conditional orders are NOT visible via `get_futures_open_orders` — only via Binance UI or TradingView.

**HARD RULE — Every futures trade MUST include SL + TP placed simultaneously with entry.**
- Never open a position without setting stop loss and take profit orders at the same time
- Use `STOP_MARKET` for SL, `TAKE_PROFIT_MARKET` for TP
- Split TP across 2 levels: TP1 (50% position) + TP2 (50% runner)

## Context Management Rules

These tools can return large payloads. Follow these rules to avoid context bloat:

1. **Always use `summary: true` on `data_get_ohlcv`** unless you specifically need individual bars
2. **Always use `study_filter`** on pine tools when you know which indicator you want — don't scan all studies unnecessarily
3. **Never use `verbose: true`** on pine tools unless the user specifically asks for raw drawing data with IDs/colors
4. **Avoid calling `pine_get_source`** on complex scripts — it can return 200KB+. Only read if you need to edit the code.
5. **Avoid calling `data_get_indicator`** on protected/encrypted indicators — their inputs are encoded blobs. Use `data_get_study_values` instead for current values.
6. **Use `capture_screenshot`** for visual context instead of pulling large datasets — a screenshot is ~300KB but gives you the full visual picture
7. **Call `chart_get_state` once** at the start to get entity IDs, then reference them — don't re-call repeatedly
8. **Cap your OHLCV requests** — `count: 20` for quick analysis, `count: 100` for deeper work, `count: 500` only when specifically needed

### Output Size Estimates (compact mode)
| Tool | Typical Output |
|------|---------------|
| `quote_get` | ~200 bytes |
| `data_get_study_values` | ~500 bytes (all indicators) |
| `data_get_pine_lines` | ~1-3 KB per study (deduplicated levels) |
| `data_get_pine_labels` | ~2-5 KB per study (capped at 50) |
| `data_get_pine_tables` | ~1-4 KB per study (formatted rows) |
| `data_get_pine_boxes` | ~1-2 KB per study (deduplicated zones) |
| `data_get_ohlcv` (summary) | ~500 bytes |
| `data_get_ohlcv` (100 bars) | ~8 KB |
| `capture_screenshot` | ~300 bytes (returns file path, not image data) |

## Tool Conventions

- All tools return `{ success: true/false, ... }`
- Entity IDs (from `chart_get_state`) are session-specific — don't cache across sessions
- Pine indicators must be **visible** on chart for pine graphics tools to read their data
- `chart_manage_indicator` requires **full indicator names**: "Relative Strength Index" not "RSI", "Moving Average Exponential" not "EMA", "Bollinger Bands" not "BB"
- Screenshots save to `screenshots/` directory with timestamps
- OHLCV capped at 500 bars, trades at 20 per request
- Pine labels capped at 50 per study by default (pass `max_labels` to override)
- Telegram tools require `TELEGRAM_BOT_TOKEN` (from @BotFather) and `TELEGRAM_CHAT_ID` (comma-separated for multiple chats) env vars
- Notion tools require `NOTION_API_KEY` (from https://www.notion.so/my-integrations) and `NOTION_TRADE_DB_ID` env vars

## Architecture

```
Claude Code ←→ MCP Server (stdio) ←→ CDP (localhost:9222) ←→ TradingView Desktop (Electron)
                                         ←→ Binance API (REST)
                                         ←→ Telegram Bot API
                                         ←→ Notion REST API
```

Pine graphics path: `study._graphics._primitivesCollection.dwglines.get('lines').get(false)._primitivesDataById`

### Binance Tool Architecture

Binance tools are registered in the same MCP server as TradingView tools (`src/tools/binance.js`). The Binance client is initialized lazily on first tool call using `BINANCE_API_KEY` and `BINANCE_API_SECRET` from `.env`. Testnet/mainnet is controlled by `BINANCE_TESTNET`. Risk defaults are read from `.env` (`FUTURES_*` variables).

### Telegram Tools

`telegram_send_message` and `telegram_send_photo` require `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` env vars. Used for trade signal distribution after report generation.

### Notion Tools

`notion_log_trade`, `notion_update_exit`, and `notion_check_schema` require `NOTION_API_KEY` and `NOTION_TRADE_DB_ID` env vars. Used for structured trade journaling with a 22-column database schema.
