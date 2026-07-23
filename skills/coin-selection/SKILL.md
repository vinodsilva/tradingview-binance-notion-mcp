---
name: coin-selection
description: 3-TF StochRSI coin scanner — find momentum candidates using StochRSI overbought/oversold zones and hidden divergence across 3 timeframes.
---

# Coin Selection — 3-TF StochRSI Momentum Scanner

Goal: Use StochRSI across 3 timeframes (1H, 4H, D) to identify coins at extreme readings or with hidden divergence. Entry on oversold bounces or overbought pullbacks validated by multi-TF confluence.

---

## Core Concept

Instead of Markov chain analysis, we use **StochRSI (14, 3, 3)** across **3 timeframes** for a cleaner, more intuitive signal:

| TF | Role | Purpose |
|----|------|---------|
| **1H** | Fast / Entry | Find the trigger — cross up from oversold or cross down from overbought |
| **4H** | Medium / Confirmation | Trend alignment — is the medium TF supporting the move? |
| **D** | Slow / Trend | HTF context — overbought/oversold on daily defines the macro extreme |

### StochRSI Zones

| Zone | StochRSI %K | Meaning |
|------|------------|---------|
| **OVERSOLD** | ≤ 20 | Potential bounce zone (BUY bias) |
| **BEARISH** | 20–50 | Bearish momentum |
| **BULLISH** | 50–80 | Bullish momentum |
| **OVERBOUGHT** | ≥ 80 | Potential pullback zone (SELL bias) |

### Divergence Types

| Divergence | Price | StochRSI | Meaning |
|-----------|-------|----------|---------|
| **Hidden Bullish** | Higher Low | Lower Low | Uptrend continuation — buy pullback |
| **Hidden Bearish** | Lower High | Higher High | Downtrend continuation — sell rally |
| **Regular Bullish** | Lower Low | Higher Low | Trend reversal up |
| **Regular Bearish** | Higher High | Lower High | Trend reversal down |

---

## Step 0: Pre-Scan — Fetch Top Volume Universe

**Quick start (one-shot):** `bash scripts/coin-stochrsi-scan.sh [count=20] [timeframes=60,240,D] [volume_min_m=5]`

**Step-by-step** — fetch universe then run `coin_scan_stochrsi`:

Get the top 20 Binance USDT pairs by 24h quote volume:

```
curl -s 'https://api.binance.com/api/v3/ticker/24hr' | node -e "
const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
const s=['USDC','USDT','FDUSD','USD1','RLUSD','DAI','TUSD','BUSD','XAUT','PAXG','USDP'];
const c=d.filter(t=>t.symbol.endsWith('USDT')&&parseFloat(t.quoteVolume)>1e6&&!s.some(x=>t.symbol.startsWith(x))&&parseFloat(t.lastPrice)>1e-4);
c.sort((a,b)=>parseFloat(b.quoteVolume)-parseFloat(a.quoteVolume));
c.slice(0,20).forEach(t=>console.log('BINANCE:'+t.symbol));
"
```

Filter rules:
- Must end in USDT
- 24h quote volume > $1M
- Exclude stablecoins (USDC, FDUSD, DAI, etc.)
- Exclude sub-penny coins (lastPrice < 0.0001)
- Sort descending by quote volume
- Take top 20

---

## Step 1: Run StochRSI 3-TF Scan

Use the `coin_scan_stochrsi` MCP tool:

```
coin_scan_stochrsi(
  symbols: ["BINANCE:BTCUSDT", "BINANCE:ETHUSDT", ...],
  timeframes: ["60", "240", "D"],    # 1H, 4H, Daily
  bars: 50,                           # bars per TF for StochRSI calc
  volume_min: 5,                      # $5M minimum avg volume
  top_n: 10                           # return top 10 results
)
```

### What happens internally:

**1. Bar Data Acquisition** — Per symbol and per TF, switch chart resolution, fetch 50 OHLCV bars.

**2. StochRSI Calculation** — Computed locally from OHLCV data (not dependent on TV studies):

- **RSI(14)** — Standard Wilder's RSI with EMA smoothing
- **Stochastic of RSI** — %K = (current RSI - min RSI over 14 periods) / (max RSI - min RSI) * 100
- **%K Line** — 3-period SMA of raw StochRSI
- **%D Line** — 3-period SMA of %K

**3. Zone Classification** — Per TF:

| %K Value | Zone |
|---------|------|
| ≤ 20 | OVERSOLD |
| 20–50 | BEARISH |
| 50–80 | BULLISH |
| ≥ 80 | OVERBOUGHT |

**4. Crossover Detection** — Compare %K vs %D on last 2 bars:
- `cross_over`: %K crosses above %D (bullish signal within zone)
- `cross_under`: %K crosses below %D (bearish signal within zone)

**5. Divergence Detection** — Compare last 3 pivot points in price vs StochRSI:
- Checks the last 3 valid (non-null) StochRSI values against corresponding price closes
- Detects 4 types: HIDDEN_BULL, HIDDEN_BEAR, REGULAR_BULL, REGULAR_BEAR
- Strength rating: STRONG (confirmed by latest pivot) or MODERATE (last 2 pivots only)

**6. Scoring:**

| Condition | Score Contribution |
|-----------|-------------------|
| 3-TF oversold alignment | 75+ (30 base + 15 per OS TF) |
| 2-TF oversold alignment | 60 (30 + 15 × 2) |
| 3-TF overbought alignment | 75+ |
| 2-TF overbought alignment | 60 |
| Bullish convergence (OS crosses + bullish) | 10 per TF |
| Bearish convergence (OB crosses + bearish) | 10 per TF |
| Bullish divergence bonus (per TF) | +15 |
| Bearish divergence bonus (per TF) | +15 |

Score capped at 100.

---

## Step 1b: REAL-EDGE FRAMEWORK

The scan now includes a composite **edge score** (0–100) alongside the basic StochRSI score. Edge analyzes five dimensions:

| Dimension | Weight | Source | What It Measures |
|-----------|--------|--------|------------------|
| **StochRSI Alignment** | 30% | Zone + cross per TF | How aligned StochRSI zones are across timeframes |
| **ADX Regime** | 20% | Directional movement | Trending (ADX ≥ 25) vs Ranging (ADX < 25) — trending = stronger signals |
| **Divergence Quality** | 25% | Multi-pivot scan | Detects ALL regular + hidden divergences across multiple swing points (not just last 2) |
| **Volume Confirmation** | 15% | Volume trend + spikes | Rising volume trend, spike on breakout, climax warning |
| **Structure Context** | 10% | Pivot proximity | Price near a swing high/low adds 20pts — key levels attract reactions |

### Edge Conviction Levels

| Edge Score | Conviction | Action |
|-----------|------------|--------|
| ≥ 70 | **HIGH** | Full confidence — all dimensions align |
| 50–69 | **MODERATE** | Valid — check kill signals before entry |
| 30–49 | **LOW** | Caution — only take with additional confluence |
| < 30 | **NOISE** | Skip — insufficient edge |

### ADX Regime Filter

ADX (Average Directional Index) differentiates trending vs ranging markets:

| ADX | Regime | Edge Impact |
|-----|--------|-------------|
| ≥ 25 | **TRENDING** | +15pts — StochRSI extremes mean reversion or trend continuation |
| < 25 | **RANGING** | +5pts — StochRSI zones less reliable, expect false breaks |

Combined with ±DI direction:
- **+DI > -DI** = bullish trend (ADX ≥ 25: strong uptrend)
- **-DI > +DI** = bearish trend (ADX ≥ 25: strong downtrend)
- ADX < 25 on all TFs = ranging — avoid trend-following entries

### Enhanced Divergence Detection

Instead of scanning only the last 2 swing points, the edge engine finds ALL pivot points and compares every consecutive pair:

| Finding | Score Boost |
|---------|-------------|
| Regular divergence (any pair) | +30 (trend reversal signal) |
| Hidden divergence (any pair) | +15 (trend continuation signal) |
| 2+ divergences detected | +15 (multi-pivot confirmation) |
| Divergence at structural level | +25 (if price near swing high/low) |
| Volume confirms divergence bar | +20 |

### Volume Confirmation

| Volume Signal | Meaning |
|--------------|---------|
| **Rising trend** | Volume increasing over the period — trend has conviction |
| **Spike** (> 1.5× avg) | Breakout/pullback with participation — valid move |
| **Climax** (> 2.5× avg) | Exhaustion risk — caution on continuation |
| **Falling trend** | Volume drying up — trend weakening |

### Volatility Regime

| ATR Ratio | Regime | Implication |
|-----------|--------|-------------|
| < 0.5× avg | **LOW** | Compression — breakout/breakdown pending |
| 0.5–1.3× | **NORMAL** | Standard conditions |
| 1.3–2.0× | **HIGH** | Momentum phase — larger stops needed |
| > 2.0× | **EXTREME** | News event capitulation — wait for stabilization |

---

## Step 2: Filter Candidates

Primary sort by **StochRSI score**, secondary sort by **edge_score**:

| Signal | Strong | Moderate | Skip |
|--------|--------|----------|------|
| **Score** | > 60 | 30–60 | < 30 |
| **Edge Score** | ≥ 50 | 30–49 | < 30 |
| **Convergence** | 3-TF alignment | 2-TF alignment | 1 TF or none |
| **Divergence** | 2+ TFs with hidden div | 1 TF with hidden div | No divergence |
| **ADX Regime** | Trending on 2+ TFs | Trending on 1 TF | All ranging |

**Priority order:**
1. Score > 60 AND edge_score ≥ 50 = **PRIMARY** (full confluence)
2. Score > 60 OR edge_score ≥ 50 = **SECONDARY** (partial confluence)
3. Score 30–60 AND edge_score 30–49 = **EDGE** (weak signal, check manually)
4. Edge ADX trending on 2+ TFs = **ADX BOOST** (add to watchlist even if StochRSI moderate)
5. edge_conviction = NOISE = **SKIP**

---

## Step 3: Visual Confirm (Top 1–2 Candidates)

For each top candidate check the edge data first, then the chart:

**Quick check with edge data:**
- `edge_conviction == "HIGH"` → high confidence, skip to Mxwll check
- `edge_conviction == "MODERATE"` → check chart for visual confirmation
- `edge_conviction == "LOW"` → kill unless StochRSI score > 60
- Check `edge_adx_regime` — if "RANGING/RANGING/RANGING" on all TFs, beware false signals
- Check `edge_volatility` — if "EXTREME" on any TF, wait for stabilization before entry

```
chart_set_symbol("BINANCE:SOLUSDT")
chart_set_timeframe("60")     # entry TF
capture_screenshot(region: "chart")
```

**Kill signals:**
- Long wicks on recent bar (rejection at zone)
- Volume spike then cliff (exhaustion)
- StochRSI curling at extreme without cross
- Divergence contradicting the signal direction
- Edge ADX showing RANGING on 2+ TFs (signal likely weak)
- Edge conviction is LOW or NOISE

---

## Step 4: Deep Check with Mxwll

```
data_get_pine_lines(study_filter: "Mxwll Suite")
data_get_pine_labels(study_filter: "Mxwll Suite")
```

Check:
- Is price near a key Mxwll level that would confirm/reject the StochRSI signal?
- Structure labels (BoS, CHoCH, HH, LL) — confirm trend direction

| Overhead Lines | Impact |
|---------------|--------|
| 0 lines | CLEAR AIR — high confidence |
| 1–3 lines | MODERATE — expected levels |
| 4+ lines | DENSE ZONE — momentum likely stalls |

---

## Step 5: Report & Handoff

```
Rank | Symbol              Dir     Score  Edge  Conviction  ADX Regime       Volatility      Convergence
 1   | SOLUSDT             BULL      75     68    HIGH         TREND/TREND/TREND  NORM/NORM/LOW  3-TF OVERSOLD
 2   | WIFUSDT             BULL      60     45    MODERATE     RANG/TREND/TREND   NORM/NORM/NORM 2-TF OVERSOLD
 3   | ETHUSDT             BEAR      75     82    HIGH         TREND/TREND/RANG   NORM/HIGH/NORM  3-TF OB + HIDDEN_BEAR
```

| Column | Description |
|--------|-------------|
| Rank | Position by score |
| Symbol | Trading pair |
| Dir | Direction (BULL/BEAR/NEUTRAL) |
| Score | 0–100 StochRSI composite |
| Edge | 0–100 real-edge composite |
| Conviction | HIGH/MODERATE/LOW/NOISE |
| ADX Regime | Per-TF trending/ranging status |
| Volatility | Per-TF ATR regime (LOW/NORMAL/HIGH/EXTREME) |
| Convergence | Signal description |

**Edge data per TF** (visible in `tf_results[i].edge`):
- `adx` — ADX value, ±DI direction, regime verdict
- `atr` — ATR value for position sizing context
- `divergence_enhanced` — all regular + hidden divergences across multiple pivot comparisons
- `structure` — nearest swing high/low, distance %, pivot count
- `volume` — spike, climax, trend direction, ratio
- `volatility_regime` — LOW/NORMAL/HIGH/EXTREME classification

**Good result:** Score > 60 AND Edge ≥ 50 AND ADX trending on 2+ TFs
**Skip:** Edge < 30 OR edge_conviction = NOISE OR all TFs ranging

Handoff top pick to chart-analyst for full institutional pipeline.


---

## Interpretation Guide

### What a Good Bullish Result Looks Like

```
SOLUSDT  BULL  Score: 75  3-TF OVERSOLD
  1H: OVERSOLD + cross over %K > %D
  4H: OVERSOLD (deep, < 15)
  D:  OVERSOLD (first time in 3 months)
```

- All 3 TFs oversold = rare, high-probability bounce setup
- Entry TF (1H) already crossing = early entry signal
- No divergence needed — extreme alignment is enough

### What a Good Bearish Result Looks Like

```
WIFUSDT  BEAR  Score: 75  Edge: 82  HIGH
  ADX: D TRENDING(-DI>+DI), 4H TRENDING, 1H TRENDING
  Divergence: 4H hidden bear (price HH, stoch LH) + 1H regular bear
  Structure: at daily swing high, nearest resistance 0.5% above
  Volume: rising trend, spike on breakdown bar 2.1x avg
  1H: OVERBOUGHT + cross under
  4H: OVERBOUGHT + HIDDEN_BEAR
  D:  BULLISH (not OB yet — room to run, ADX trending)
```

- 2 TFs overbought + hidden bear divergence on 4H = high-confidence short
- ADX trending on 3 TFs = strong directional conviction
- Multiple divergences (4H hidden + 1H regular) = multi-pivot confluence
- Daily not overbought = macro trend still has room

### What to Skip

```
DOGEUSDT  BULL  Score: 20  Edge: 15  NOISE
  ADX: 1H RANGING, 4H RANGING, D RANGING
  Divergence: none detected across all pivot points
  Volume: falling trend
  Structure: no nearby swing levels
  1H: OVERSOLD
  4H: BEARISH
  D:  BULLISH
```

- Only 1 TF oversold
- All TFs ranging (ADX < 25) — no directional conviction
- No divergence across any pivot pair
- Edge score 15 = NOISE — insufficient edge
- Skip — wait for regime change or new divergence to form

---

## Execution Estimate

- Top 5 symbols × 3 TFs: ~3–5 min (via coin_scan_stochrsi MCP tool)
- Mxwll check for top 1–2: ~3–5 min

---

## Comparison: Markov vs StochRSI

| Aspect | Markov Scanner | StochRSI Scanner |
|--------|---------------|------------------|
| Signal | Transition matrix + HMM | StochRSI zones + divergence |
| Timeframes | Entry TF + HTF only | 3 fixed TFs (1H, 4H, D) |
| Scoring | Entropy, persistence, reliability | Zone alignment, crossovers, divergence |
| Edge | Predictable Markov paths | Extreme readings + hidden divergence |
| Strengths | Trending markets with momentum | Mean reversion + trend continuation |
| Weaknesses | Noisy in ranging markets | Less effective in strong trends |
