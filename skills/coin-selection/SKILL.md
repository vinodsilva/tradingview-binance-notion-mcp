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

## Step 2: Filter Candidates

| Signal | Strong | Moderate | Skip |
|--------|--------|----------|------|
| **Score** | > 60 | 30–60 | < 30 |
| **Convergence** | 3-TF alignment | 2-TF alignment | 1 TF or none |
| **Divergence** | 2+ TFs with hidden div | 1 TF with hidden div | No divergence |

**Priority order:**
1. 3-TF oversold with hidden bull divergence = **PRIMARY BUY**
2. 3-TF overbought with hidden bear divergence = **PRIMARY SELL**
3. 2-TF oversold/overbought = **SECONDARY**
4. Hidden divergence on 2+ TFs in trend direction = **EDGE**
5. Single TF with no divergence = **SKIP**

---

## Step 3: Visual Confirm (Top 1–2 Candidates)

For each top candidate:

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
Rank | Symbol              Dir     Score  Convergence                    OS  OB  1H          4H          D
 1   | SOLUSDT             BULL      75    3-TF OVERSOLD                  3   0  OVERS:CROSS  OVERS       OVERS
 2   | WIFUSDT             BULL      60    2-TF OVERSOLD                  2   0  OVERS       BULL        BULL
 3   | ETHUSDT             BEAR      75    3-TF OVERBOUGHT + HIDDEN_BEAR  0   3  OVERB:CROSS  OVERB:DIV   OVERB
```

| Column | Description |
|--------|-------------|
| Rank | Position by score |
| Symbol | Trading pair |
| Dir | Direction (BULL/BEAR/NEUTRAL) |
| Score | 0–100 composite score |
| Convergence | Signal description (3-TF OVERSOLD, MULTI-TF DIV BULL, etc.) |
| OS | Count of TFs in oversold zone |
| OB | Count of TFs in overbought zone |
| 1H/4H/D | Zone + signal per TF (OVERS, OVERB, BULL, BEAR, CROSS=cross, DIV=divergence) |

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
WIFUSDT  BEAR  Score: 75  3-TF OVERBOUGHT + HIDDEN_BEAR
  1H: OVERBOUGHT + cross under
  4H: OVERBOUGHT + HIDDEN_BEAR (price HH, stoch LH)
  D:  BULLISH (not overbought yet — room to run)
```

- 2 TFs overbought + hidden bear divergence on 4H = high-confidence short
- Daily not overbought = macro trend still has room
- Hidden bear divergence confirms downtrend continuation

### What to Skip

```
DOGEUSDT  BULL  Score: 20  NO CONFLUENCE
  1H: OVERSOLD
  4H: BEARISH
  D:  BULLISH
```

- Only 1 TF oversold
- 4H and 1H disagree on direction
- No divergence to tip the scale
- Skip — insufficient confluence

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
