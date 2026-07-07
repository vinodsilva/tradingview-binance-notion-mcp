---
name: coin-selection
description: Find coins in explosive momentum moves across Binance futures — accelerating price, expanding volume, no pullbacks.
---

# Coin Selection — Momentum Scan

Goal: Find coins in an active momentum phase — where price is accelerating, volume is expanding, and there are no pullbacks. Momentum fades fast; you want to catch the middle, not the end.

---

## Step 0: Context Filters (Pre-Scan Gate)

Skip the entire scan if these fail — momentum trades against the macro are traps.

### 0a. BTC/ETH Correlation Check

```
chart_set_symbol("BINANCE:BTCUSDT")
chart_set_timeframe("60")
data_get_ohlcv(count: 5, summary: true)
```

| Condition | Verdict |
|-----------|---------|
| BTC up > 1% in last 5 bars | GREEN — alt momentum likely sustainable |
| BTC flat (+/- 1%) | YELLOW — proceed but check each coin for independent narrative |
| BTC down > 1% in last 5 bars | **CANCEL TIER 2/3 SCAN** — alt momentum against BTC drop is a trap. Only scan Tier 1 |
| BTC in momentum (passes filters below) | MEGA GREEN — alt season odds elevated |

### 0b. HTF Trend Check (4H/D)

For each surviving candidate, check trend bias:

```
chart_set_timeframe("240")
chart_get_state()  # re-use symbol if already set
```

| TF | Check |
|----|-------|
| **4H** | Are we in a trend or range? Momentum into 4H resistance has lower reliability |
| **D** | Is the D trend aligned with momentum direction? If not, downgrade grade by 2 points |

**Rule:** Momentum opposite to D trend → max position = 50% of normal size. Momentum into 4H OB → flag as "resistance proximity."

### 0c. Resistance/Liquidity Check via Mxwll

Before reporting a top pick, check overhead resistance:

```
data_get_pine_lines(study_filter: "Mxwll")
```

Count how many Mxwll lines sit within 5-10% of current price:

| Overhead Resistance | Impact |
|--------------------|--------|
| 0 lines | CLEAR AIR — high reliability |
| 1-3 lines | MODERATE — expected levels, note them |
| 4+ lines | DENSE ZONE — momentum likely stalls, downgrade grade by 1 |

### 0d. Session Timing

| Session | Reliability | Action |
|---------|------------|--------|
| Asia open + 2h (19:00-21:00 UTC) | MEDIUM | Range expansion phase — accept momentum |
| London open + 4h (07:00-11:00 UTC) | HIGH | Best momentum window |
| NY open + 3h (13:00-16:00 UTC) | HIGH | Volatility peak |
| NY late (19:00-21:00 UTC) | **LOW** | Flag candidates: "late session — momentum may be exhaustion" |
| Weekend | **AVOID** | Low liquidity, fakeouts common |

---

## Step 1: Scan — Momentum Cascade

For each coin, switch to 60m timeframe and check last 10 bars. Momentum shows up on 60m before it's obvious on 4H.

```
chart_set_symbol("BINANCE:SOLUSDT")
chart_set_timeframe("60")
data_get_ohlcv(count: 10, summary: false)
```

### Extracted Data

#### From OHLCV Bars:
- **Bar ranges**: (high - low) for each of last 10 bars, as **% of price** (normalized)
- **Bar volumes**: volume for each of last 10 bars
- **Bar direction**: close > open for green, close < open for red
- **Bar body %**: abs(close - open) / (high - low) — real body dominance
- **Volume SMA20**: baseline for Z-score computation (pre-computed from earlier data or pulled)
- **Consecutive direction**: uninterrupted string of same-direction bars

#### From RSI Indicator on 60m:
```
data_get_study_values()  # RSI Divergence Indicator must be on chart
```

- **RSI value**: current RSI reading
- **RSI divergence**: check for Regular/Hidden Bullish/Bearish labels

### Normalized Metrics

All range-based filters use **range as % of current price**:

```
range_pct = (high - low) / close * 100
```

This makes a 2% move on ADA ($0.18) comparable to a 2% move on BTC ($60k) — without this, the scan is blind to smaller-priced coins.

### Volume Z-Score (Replaces Raw Volume Floor)

Instead of a flat $10M floor, compute how unusual current volume is:

```
volume_z_score = (avg_volume_last_3 - avg_volume_20) / stddev_volume_20
```

| Z-Score | Meaning |
|---------|---------|
| > 2.0 | EXTREME volume anomaly — institutional conviction |
| 1.0 - 2.0 | Strong volume — likely genuine |
| 0.5 - 1.0 | Moderate — needs other confirmation |
| < 0.5 | No volume edge — FAIL filter |

**Fallback:** If SMA20/stddev unavailable, use original $10M floor as hard minimum.

### Must-Pass Filters (All Must Pass)

| # | Filter | Criteria | Why |
|---|--------|----------|-----|
| 1 | **Direction cluster** | 5+ of last 7 bars same direction | Strong directional bias |
| 2 | **No counter bars** | No bar's range > **30%** retrace of previous bar's range | Real momentum doesn't retrace deep. Tightened from 50%. |
| 3 | **Acceleration** | **Rolling 3-bar avg range** expanding: avg(bar 1-3) <= avg(bar 3-5) <= avg(bar 5-7) | Smoothed version — one slightly smaller bar doesn't kill the scan |
| 4 | **Volume expansion** | Volume Z-score >= 1.0 OR last 3 bars volume increasing bar-over-bar | Money pouring in |
| 5 | **Body conviction** | Last 3 bars: avg body > 60% of range | Small wicks = no rejection |
| 6 | **Liquidity floor** | avg_volume > $10M over the 10 bars, OR volume Z-score > 2.0 with market cap > $500M | Slippage protection |
| 7 | **Not climaxed** | No single bar's range > 10% of price | That's the blow-off, not the run |
| 8 | **RSI not extreme** | RSI between 30-80 on 60m | RSI > 80 = overbought exhaustion. RSI < 30 = bear flag bounce, not momentum |

**Fail any → skip. Pass all → momentum candidate.**

---

## Step 2: Grade — Momentum Strength

Grade each survivor on momentum quality:

| Signal | Strong (+2) | Moderate (+1) | Weak (0) |
|--------|-------------|---------------|----------|
| **Consecutive green/red** | 7+ of last 7 | 5-6 of last 7 | 5 of last 7 |
| **Rolling range expansion** | Each 3-bar avg > previous by 20%+ | Each > previous | Last avg < previous |
| **Volume expansion** | Z-score > 2.0 OR each bar > previous by 30%+ | Z-score 1.0-2.0 OR each > previous | Last bar < previous or Z-score < 1.0 |
| **Body quality** | All bars body > 75% of range | All bars > 60% | Mixed body/wick |
| **Bar stacking** | Each bar opens at/near prev close and extends (no gaps) | Minor gaps | Wide gaps / overlapping |
| **RSI zone** (NEW) | RSI 40-60 (room to run) | RSI 60-75 or 25-40 (getting stretched) | RSI > 75 or < 25 (+3 if divergence against momentum) |
| **HTF alignment** | D + 4H aligned with momentum direction | 4H aligned, D neutral | D opposite (-1) |

**Grade:** 14 max. 10+ = momentum runner. 7-9 = fading momentum. < 7 = skip.

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

### RSI Divergence Detection

From `data_get_study_values()`, check for divergence labels:

| RSI Divergence Type | Meaning | Grade Impact |
|---------------------|---------|-------------|
| Regular Bearish divergence | Price HH, RSI LH — trend weakening | 🔴 — skip candidate if RSI > 75 |
| Hidden Bearish divergence | Price LH, RSI HH — downtrend continuation | 🟡 — grade -1 if momentum is UP |
| Regular Bullish divergence | Price LL, RSI HL — reversal forming | 🟢 — potential momentum start, flag for watchlist |
| Hidden Bullish divergence | Price HL, RSI LL — uptrend continuation | 🟢 — momentum likely sustainable |

### Fade/Warning Flags

Check the last 3 bars on the screenshot and RSI values for early fade signals:

| Signal | Flag | Action |
|--------|------|--------|
| Last bar wick > 30% of range | 🔴 REJECTION | Skip or 50% size only |
| RSI > 80 on 60m | 🔴 OVERBOUGHT | Momentum exhausted — skip runner |
| RSI < 25 on 60m | 🔴 OVERSOLD BOUNCE | Not momentum — likely dead cat bounce, skip |
| Regular Bearish divergence on 60m | 🔴 DIVERGENCE + RSI | Skip — momentum structurally weakening |
| Volume cliff on last bar (> 40% drop from prior) | 🟡 VOLUME CLIFF | Momentum fading — grade -1 |
| Last bar body < 40% of range | 🟡 DOJI-LIKE | Exhaustion possible |
| Price curling within 2% of VWAP | 🟡 MEAN REVERSION | Run likely over |
| RSI 70-80 with no divergence | 🟡 STRETCHED | Grade -1 — running out of room |

Any 🔴 flag → skip candidate regardless of grade.

---

## Step 4: Report & Handoff

```
## Momentum Scan

Context: BTC [+2.3% in 5h] | Session: London | HTF Alignment: 3 of 4 candidates aligned

Scanned: [X] | Momentum candidates: [X] | Runners (8+): [X] | Fade-flagged: [X]

| Rank | Symbol | Grade | Direction | Bars | Range Exp. | Vol Z-Score | RSI | Divergence | Run Size | Resistance | Flags |
|------|--------|-------|-----------|------|------------|-------------|-----|------------|----------|------------|-------|
| 1 | SOLUSDT | 12/14 | UP | 7/7 | 1.3x/1.4x/1.2x | 2.4 | 58 | none | +8.4% | 0 lines | clean |
| 2 | PEPEUSDT | 9/14 | UP | 6/7 | 1.1x/1.2x/0.9x | 1.8 | 71 | none | +14.2% | 2 lines | RSI elevated |

→ Top pick to chart-analysis
```

---

## Step 5: Average Momentum Duration

Once a coin passes filters, estimate how much runway it likely has:

```
bars_since_start = count of consecutive same-direction bars from the beginning of the run
```

| Bars In | Remaining Candle Estimate (60m) | Reliability |
|---------|-------------------------------|-------------|
| 1-3 | 5-9 bars remaining | Early — best edge |
| 4-6 | 2-5 bars remaining | Middle — manageable |
| 7-9 | 0-2 bars remaining | Late — high risk of exhaustion |
| 10+ | Run is extended | **Skip or scalp only** |

Most momentum runs on 60m last 8-12 bars before a pullback or reversal.

### RSI-Based Runway Adjustment

Adjust the remaining candle estimate based on RSI:

| RSI on 60m | Runway Adjustment |
|------------|------------------|
| 40-60 | Normal estimate — room to run |
| 60-70 | Subtract 1-2 bars — entering stretch zone |
| 70-80 | Subtract 3-4 bars — approaching exhaustion |
| > 80 | **Skip or scalp only** — momentum terminal phase |
| < 35 | Not momentum — likely bounce. Require HTF alignment to trust |

---

## Step 6: Dynamic Discovery — Volume-First Screening

No hardcoded coin lists. Every session starts by discovering what has tradable volume right now.

### 6a. Populate Watchlist from Top Volume

Get Binance futures perpetuals sorted by 24h volume:

```
watchlist_add("BINANCE:BTCUSDT")
watchlist_add("BINANCE:ETHUSDT")
watchlist_add("BINANCE:SOLUSDT")
... etc — or use symbol_search(type: "crypto", query: "USDT")
```

**Alternative:** If TradingView watchlist already contains your universe, use:
```
watchlist_get()
```

This returns all symbols with last price, change, and change%. Sort by volume (change% gives a proxy for activity).

### 6b. Volume Buckets (Replace Tiers)

Filter by 24h volume proxy (from watchlist change or quick OHLCV check):

| Bucket | Volume Filter | Scan Frequency | BTC Gate |
|--------|--------------|----------------|----------|
| **TIER 1** | Avg volume > $100M or top 15 by volume | Every session | Always allowed |
| **TIER 2** | Avg volume $10M-$100M | Daily | Skip if BTC down > 1% |
| **TIER 3** | Avg volume $1M-$10M (micro caps) | Only if BTC in momentum | Only if BTC in momentum |
| **BELOW** | Avg volume < $1M | **SKIP** — slippage kills momentum entries | — |

### 6c. Auto-Sort Candidates

After scanning all coins in a bucket, rank by volume Z-score (not by name):

```
candidates sorted by volume_z_score descending
top 3 candidates → full momentum scan (filters + grade)
```

This naturally finds the coins with the most unusual current activity, regardless of whether they're BTC, a memecoin, or an obscure alt.

### 6d. Watchlist Management

```
# Step 1: Clear old watchlist and load fresh top-volume coins
watchlist_add("BINANCE:BTCUSDT")
watchlist_add("BINANCE:ETHUSDT")
... (top 20-30 by 24h volume from Binance)

# Step 2: Pull watchlist with prices
watchlist_get()

# Step 3: Iterate — sort by volume proxy, scan top-down until you find 3 candidates or exhaust the list
```

**Execution estimate:** ~15-20 min for a full scan of TIER 1 + TIER 2. ~5 min if BTC gate restricts to TIER 1 only.

Momentum is rare. Most sessions you'll find 0-2 candidates regardless of how many coins you scan. That's normal — forcing a momentum trade when there isn't one is how you lose.
