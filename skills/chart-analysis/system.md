---
name: system
description: Global rules, methodology, MCP setup, output format, and analysis standards for QuantMirror V4 Institutional Framework
---

# System — QuantMirror V4 Institutional Framework

Core principle: **Price is a lagging indicator. Volume is a leading indicator. Structure is the context.**

Data-driven, not narrative-driven. Gather data first, analyze later.

---

## QuantMirror V4 3-Layer Architecture

### Layer 1 — Quant Engine (Deterministic)
Objective calculations first: Multi-timeframe structure (1W, 1D, 6H, 4H, 1H, 15M, 5M), SMC (BOS, CHOCH, MSS), liquidity sweeps, order blocks, FVGs, swing highs/lows, Fibonacci (0.618-0.65 entries, 1.272/1.618/2.0 targets), ATR, RSI, MACD, OBV, EMA 50/200, VWAP, relative volume, session filters.

### Layer 2 — AI Context Engine
AI interprets: Wyckoff phase classification, VSA, Elliott Wave (supporting signal only), crypto news sentiment, BTC/ETH market context, macro narrative, confidence explanation.

### Layer 3 — Execution Engine
Trade only when: HTF trend aligns, liquidity aligns, volume confirms, volatility acceptable, R:R >= 2, news filter passes, confidence threshold passes.

### Weighted Decision Model

| Component | Base Weight | Dynamic Adj | Notes |
|-----------|-------------|-------------|-------|
| Market Structure | 30% | ±5% | More weight when CHOCH detected on 2+ TFs (→35%). Less when structure ambiguous (→25%) |
| Volume / VSA | 25% | ±5% | More weight when 2.0x+ volume at key level (→30%). Less when volume declining on all TFs (→20%) |
| Liquidity | 15% | **+10%/−5%** | **+10% when A-grade sweep detected** (→25%). −5% when sweep missing or C-grade (→10%) |
| Momentum | 10% | ±0% | Fixed — RSI at extreme (oversold in uptrend / overbought in downtrend) adds confluence but doesn't change weight |
| Order Flow / DOM | 10% | ±0% | Fixed — point-in-time snapshot, too unreliable for dynamic adjustment |
| Elliott Wave | 10% | −5% | Fixed — supporting only. Reduce to 5% when wave count conflicts with structure |

**How dynamic weights work:**
- Start with base weights. Adjust per the dynamic adj column based on detected conditions.
- Normalize so total always = 100% after adjustments.
- Example (BTCUSDT with A-grade sweep counter to HTF trend): Market Structure 30%, Volume 25%, Liquidity 15%→25%, Momentum 10%, Order Flow 10%, Elliott Wave 10%→0% (irrelevant), normalize: 30/25/25/10/10/0 = 84 → normalize to 100: 35.7/29.8/29.8/11.9/11.9/0 |

### Confluence Checklist (11 Points)

1. Trend alignment (HTF = LTF)
2. BOS / CHOCH confirmation
3. Sweep direction matches trade direction
4. Order Block / FVG interaction
5. Fibonacci confluence
6. Volume confirmation (1.5x+)
7. Wyckoff phase support
8. Momentum confirmation (RSI)
9. VSA / Order flow alignment
10. DOM directional bias
11. Risk management validation (R:R >= 2)

**No trade if confluence < 8/11**

### Absolute No-Trade Rules (Override All Analysis)

These rules cannot be overridden by any confluence score. If ANY rule triggers, the trade is rejected regardless of score.

| Rule | Why |
|------|-----|
| No shorting parabolic (LOW_CAP_PARABOLIC regime) | Parabolic moves gap through stops. Wait for 2-TF CHOCH. |
| No shorting at ATH | The market has no resistance above. Only long until structure breaks. |
| No buying at ATL | The market has no support below. Only short until structure breaks. |
| No trading through major news (FOMC, CPI, earnings) | Spread widens 3-10x. Stops get hunted. Wait 30 min post-release. |
| No trading between key levels without a trigger | Trading "no-man's land" (mid-range without sweep/inducement/BOS) has 0 edge. |
| No trading when W + D + 4H all show balance/range | If all 3 core TFs show no direction, there is no tradeable edge. |

---

## MCP Tool Setup

### Session Initialization

```python
chart_get_state()  # Get current symbol, timeframe, entity IDs for indicators
quote_get()        # Real-time price snapshot
```

### Indicator Setup (Call Once Per Session)
Use `chart_manage_indicator` with **full indicator names**:

| Indicator | Full Name to Use | Purpose |
|-----------|-----------------|---------|
| Volume | "Volume" | Raw volume bars |
| VWAP | "Volume Weighted Average Price" | Volume-weighted average with std dev bands |
| RSI | "Relative Strength Index" (14 period) | Divergence detection, momentum |
| EMA 50 | "Moving Average Exponential" | Trend context (set length=50 via `inputs`) |
| EMA 200 | "Moving Average Exponential" | Major trend context (set length=200 via `inputs`) |
| ATR | "Average True Range" | Volatility measurement |

Get entity IDs from `chart_get_state()` after adding indicators, then reuse them.

### Context Management Rules

1. **Always use `summary: true`** on `data_get_ohlcv` unless individual bars are needed
2. **Use count=200 for all OHLCV requests** — 200 bars per timeframe for full structural analysis. Capped at 500 max by TradingView MCP.
3. **Call `chart_get_state` once** at session start — reuse entity IDs
4. **Prefer `capture_screenshot`** over verbose indicator data for visual context
5. **Never re-add indicators** already on chart — reference by entity ID
6. **Call `depth_get()` for order flow** — DOM data is a point-in-time snapshot. Read it fresh each analysis.

---

## Step 0: Data Acquisition — Scripting Approach

### Timeframe Hierarchy

**W → D → 6H → 4H → 60 → 15 → 5**

| TF | Bar Span | Role |
|----|----------|------|
| W | 1 week | HTF trend direction, major structure |
| D | 1 day | Medium-term bias, key OB/FVG zones |
| 6H | 6 hours | Daily session breakdown (Asia/London/US) |
| 4H | 4 hours | Standard institutional TF, swing structure |
| 60 | 1 hour | Execution bias, session structure |
| 15 | 15 min | Entry timing, liquidity sweeps |
| 5 | 5 min | Precision entry, last-bar confirmation |

### Pine Script Collector (Recommended)

Write a single Pine Script that uses `request.security()` to pull summary stats from all timeframes simultaneously.

```pine
//@version=6
indicator("MTF Data Collector", overlay=false)

[wClose, wHigh, wLow, wVol, wVolAvg] = request.security(syminfo.tickerid, "W", [close, high, low, volume, ta.sma(volume, 20)])
[dClose, dHigh, dLow, dVol, dVolAvg] = request.security(syminfo.tickerid, "D", [close, high, low, volume, ta.sma(volume, 20)])
[s6Close, s6High, s6Low, s6Vol, s6VolAvg] = request.security(syminfo.tickerid, "360", [close, high, low, volume, ta.sma(volume, 20)])
[s4Close, s4High, s4Low, s4Vol, s4VolAvg] = request.security(syminfo.tickerid, "240", [close, high, low, volume, ta.sma(volume, 20)])
[hClose, hHigh, hLow, hVol, hVolAvg] = request.security(syminfo.tickerid, "60", [close, high, low, volume, ta.sma(volume, 20)])
[mClose, mHigh, mLow, mVol, mVolAvg] = request.security(syminfo.tickerid, "15", [close, high, low, volume, ta.sma(volume, 20)])
[fClose, fHigh, fLow, fVol, fVolAvg] = request.security(syminfo.tickerid, "5", [close, high, low, volume, ta.sma(volume, 20)])

var table t = table.new(pos.middle_right, 6, 8, bgcolor=color.new(color.black, 90))
if barstate.islast
    table.cell(t, 0, 0, "TF", textcolor=color.gray)
    table.cell(t, 1, 0, "Close", textcolor=color.gray)
    table.cell(t, 2, 0, "Range", textcolor=color.gray)
    table.cell(t, 3, 0, "Vol", textcolor=color.gray)
    table.cell(t, 4, 0, "VolR", textcolor=color.gray)
    table.cell(t, 5, 0, "BodyR", textcolor=color.gray)
    for [tf, close, high, low, vol, volAvg, row] in [
        ["W", wClose, wHigh, wLow, wVol, wVolAvg, 1],
        ["D", dClose, dHigh, dLow, dVol, dVolAvg, 2],
        ["6H", s6Close, s6High, s6Low, s6Vol, s6VolAvg, 3],
        ["4H", s4Close, s4High, s4Low, s4Vol, s4VolAvg, 4],
        ["60", hClose, hHigh, hLow, hVol, hVolAvg, 5],
        ["15", mClose, mHigh, mLow, mVol, mVolAvg, 6],
        ["5", fClose, fHigh, fLow, fVol, fVolAvg, 7]]
        range_ = high - low
        bodyR = math.abs(close - open) / (range_ != 0 ? range_ : 1)
        volR = volAvg != 0 ? vol / volAvg : 0
        table.cell(t, 0, row, tf)
        table.cell(t, 1, row, str.tostring(close, "#.##"))
        table.cell(t, 2, row, str.tostring(range_, "#.##"))
        table.cell(t, 3, row, str.tostring(vol, "#.##"))
        table.cell(t, 4, row, str.tostring(volR, "#.##"))
        table.cell(t, 5, row, str.tostring(bodyR, "#.##"))
```

Then: `data_get_pine_tables(study_filter="MTF Data Collector")` — reads all 7 TFs in one call.

### Direct Approach (Fallback)

1. `chart_set_timeframe("W")` → `data_get_ohlcv(count=100)` → `data_get_study_values()`
2. `chart_set_timeframe("D")` → repeat
3. `chart_set_timeframe("6H")` → repeat (use `360`)
4. `chart_set_timeframe("4H")` → repeat (use `240`)
5. `chart_set_timeframe("60")` → repeat
6. `chart_set_timeframe("15")` → repeat
7. `chart_set_timeframe("5")` → repeat

### Order Flow (Point-in-Time)

On execution timeframe (15M or 5M): `depth_get()` — single DOM snapshot. See `orderflow.md` for limitations.

### Indicator Configuration

When adding "Moving Average Exponential", use `inputs` parameter:
```
chart_manage_indicator(action="add", indicator="Moving Average Exponential", inputs='{"length": 50}')
chart_manage_indicator(action="add", indicator="Moving Average Exponential", inputs='{"length": 200}')
```

### Indicator Name Reference

| Short Name | Full Name for MCP |
|-----------|------------------|
| RSI | Relative Strength Index |
| EMA | Moving Average Exponential |
| SMA | Moving Average |
| VWAP | Volume Weighted Average Price |
| BB | Bollinger Bands |
| MACD | MACD |
| ATR | Average True Range |
| OBV | On Balance Volume |
