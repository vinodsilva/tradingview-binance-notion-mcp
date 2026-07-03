---
name: coin-selection
description: Find coins in explosive momentum moves across Binance futures — accelerating price, expanding volume, no pullbacks.
---

# Coin Selection — Momentum Scan

Goal: Find coins in an active momentum phase — where price is accelerating, volume is expanding, and there are no pullbacks. Momentum fades fast; you want to catch the middle, not the end.

---

## Step 1: Scan — Momentum Cascade

For each coin, switch to 60m timeframe and check last 10 bars. Momentum shows up on 60m before it's obvious on 4H.

```
chart_set_symbol("BINANCE:SOLUSDT")
chart_set_timeframe("60")
data_get_ohlcv(count: 10, summary: false)   # Need individual bars this time
```

### From OHLCV Bars, Extract:
- **Bar ranges**: (high - low) for each of last 10 bars
- **Bar volumes**: volume for each of last 10 bars
- **Bar direction**: close > open for green, close < open for red
- **Bar body %**: abs(close - open) / (high - low) — real body dominance
- **Consecutive direction**: uninterrupted string of same-direction bars

### Must-Pass Filters (All Must Pass)

| # | Filter | Criteria | Why |
|---|--------|----------|-----|
| 1 | **Direction cluster** | 5+ of last 7 bars same direction | Strong directional bias |
| 2 | **No counter bars** | No bar > 50% retrace of previous bar | Real momentum doesn't retrace deep |
| 3 | **Acceleration** | Last 3 bars: each bar's range >= previous bar's range | Expanding energy, not fading |
| 4 | **Volume expansion** | Last 3 bars: volume increasing bar-over-bar | Money pouring in, not tapering |
| 5 | **Body conviction** | Last 3 bars: body > 60% of range for direction bars | Small wicks = no rejection |
| 6 | **Volume floor** | avg_volume > $10M over the 10 bars | Slippage kills momentum entries |
| 7 | **Not climaxed** | No single bar > 10% range | That's the blow-off, not the run |

**Fail any → skip. Pass all → momentum candidate.**

---

## Step 2: Grade — Momentum Strength

Grade each survivor on momentum quality:

| Signal | Strong (+2) | Moderate (+1) | Weak (0) |
|--------|-------------|---------------|----------|
| **Consecutive green/red** | 7+ of last 7 | 5-6 of last 7 | 5 of last 7 |
| **Range expansion** | Each bar > previous by 20%+ | Each > previous | Last bar < previous |
| **Volume expansion** | Each bar > previous by 30%+ | Each > previous | Last bar < previous |
| **Body quality** | All bars body > 75% of range | All bars > 60% | Mixed body/wick |
| **Bar stacking** | Each bar opens at/near prev close and extends (no gaps) | Minor gaps | Wide gaps / overlapping |

**Grade:** 10 max. 7+ = momentum runner. 5-6 = fading momentum. < 5 = skip.

---

## Step 3: Visual Confirm — Momentum Visuals

```
capture_screenshot(region: "chart")
```

**Momentum looks like:**
- Stepping pattern: each bar's low is above the last bar's close (bull) — price doesn't revisit old ground
- Candles with tiny or no wicks on the direction side
- Volume bars growing taller left to right
- Price accelerating away from VWAP/EMAs (widening gap)
- No overlapping consolidation zone — just extension

**Kill signals on screenshot:**
- Long wick on the most recent bar (first sign of rejection)
- Volume spike then drop on last bar (blow-off)
- Price curling back toward VWAP (mean reversion starting)
- Doji at the top/bottom of the run (exhaustion)

---

## Step 4: Report & Handoff

```
## Momentum Scan

Scanned: [X] | Momentum candidates: [X] | Runners: [X]

| Rank | Symbol | Grade | Direction | Bars | Range Exp. | Vol Exp. | Run Size |
|------|--------|-------|-----------|------|------------|----------|----------|
| 1 | SOLUSDT | 9/10 | UP | 7/7 | 1.3x/1.4x/1.2x | 1.5x/1.3x/1.6x | +8.4% |
| 2 | PEPEUSDT | 7/10 | UP | 6/7 | 1.1x/1.2x/0.9x | 1.4x/1.1x/1.3x | +14.2% |

→ Top pick to chart-analysis
```

---

## Step 5: Efficiency — Tiered Scan

| Tier | Coins | When | Est. |
|------|-------|------|------|
| 1 | BTC, ETH, SOL, XRP, DOGE, PEPE, WIF, BONK, SUI, AVAX | Every session | 5 min |
| 2 | ADA, DOT, LINK, NEAR, APT, OP, ARB, INJ, FET, SEI, TIA, ATOM, UNI, ETC, XLM, TRX, SHIB, FLOKI, DOGS, 1000PEPE | Daily | 10 min |
| 3 | Rest | Weekly / BTC breakout | 15 min |

Momentum is rare. Most sessions you'll find 0-2 candidates across all tiers. That's normal — forcing a momentum trade when there isn't one is how you lose.
