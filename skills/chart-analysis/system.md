---
name: system
description: Global rules, methodology, MCP setup, and analysis standards for QuantMirror V4 Framework
---

# System — QuantMirror V4 Framework

Core principle: **Price is a lagging indicator. Volume is a leading indicator. Structure is the context.**

Data-driven, not narrative-driven. Gather data first, analyze later.

---

## Confluence Checklist (11 Points)

1. Trend alignment (HTF = LTF)
2. BOS / CHOCH confirmation
3. Sweep direction matches trade direction
4. Order Block / FVG interaction
5. Fibonacci confluence
6. Volume confirmation (1.5x+)
7. Wyckoff phase support
8. Momentum confirmation (RSI)
9. VSA alignment
10. DOM directional bias (if available)
11. Risk management validation (R:R >= 2)

**No trade if confluence < 8/11**

### Absolute No-Trade Rules (Override All Analysis)

| Rule | Why |
|------|-----|
| No shorting parabolic | Parabolic moves gap through stops. Wait for 2-TF CHOCH. |
| No shorting at ATH | The market has no resistance above. Only long until structure breaks. |
| No buying at ATL | The market has no support below. Only short until structure breaks. |
| No trading through major news (FOMC, CPI, earnings) | Spread widens 3-10x. Stops get hunted. Wait 30 min post-release. |
| No trading between key levels without a trigger | Trading mid-range without sweep/inducement/BOS has 0 edge. |
| No trading when W + D + 4H all show balance/range | If all 3 core TFs show no direction, there is no tradeable edge. |

---

## MCP Tool Setup

### Session Initialization

```python
chart_get_state()  # Get current symbol, timeframe, entity IDs for indicators
quote_get()        # Real-time price snapshot
```

### Indicator Setup (Call Once Per Session)

| Indicator | Full Name to Use | Purpose |
|-----------|-----------------|---------|
| Volume | "Volume" | Raw volume bars |
| VWAP | "Volume Weighted Average Price" | Volume-weighted average with std dev bands |
| RSI | "Relative Strength Index" (14 period) | Divergence detection, momentum |
| EMA 50 | "Moving Average Exponential" | Trend context (set length=50 via `inputs`) |
| EMA 200 | "Moving Average Exponential" | Major trend context (set length=200 via `inputs`) |

### Context Management Rules

1. **Always use `summary: true`** on `data_get_ohlcv` unless individual bars are needed
2. **Use count=100** for OHLCV requests — sufficient for structural analysis
3. **Call `chart_get_state` once** at session start — reuse entity IDs
4. **Prefer `capture_screenshot`** over verbose indicator data for visual context
5. **Never re-add indicators** already on chart — reference by entity ID
6. **Call `depth_get()` for order flow** — DOM data is a point-in-time snapshot

---

## Step 0: Data Acquisition

### Timeframe Hierarchy

**W → D → 4H → 60 → 15**

| TF | Bar Span | Role |
|----|----------|------|
| W | 1 week | HTF trend direction, major structure |
| D | 1 day | Medium-term bias, key OB/FVG zones |
| 4H | 4 hours | Swing structure |
| 60 | 1 hour | Execution bias, session structure |
| 15 | 15 min | Entry timing, liquidity sweeps |

### Data Collection

Switch timeframes and collect data per TF:

1. `chart_set_timeframe("W")` → `data_get_ohlcv(count=100, summary=true)` → `data_get_study_values()`
2. `chart_set_timeframe("D")` → repeat
3. `chart_set_timeframe("240")` → repeat
4. `chart_set_timeframe("60")` → repeat
5. `chart_set_timeframe("15")` → repeat

### Order Flow (Point-in-Time)

On execution timeframe (15M or 5M): `depth_get()` — single DOM snapshot.

### Indicator Name Reference

| Short Name | Full Name for MCP |
|-----------|------------------|
| RSI | Relative Strength Index |
| EMA | Moving Average Exponential |
| SMA | Moving Average |
| VWAP | Volume Weighted Average Price |
| BB | Bollinger Bands |
| MACD | MACD |
