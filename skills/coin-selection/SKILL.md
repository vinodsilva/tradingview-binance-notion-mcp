---
name: coin-selection
description: Markov chain MTF coin scanner — find momentum candidates using Markov transition matrices, entropy analysis, and HTF trend context.
---

# Coin Selection — Markov MTF Momentum Scanner

Goal: Use Markov chain analysis on the entry timeframe to identify coins with predictable momentum paths, cross-referenced with higher-TF trend context. Entry on breakout momentum, validated by low-entropy transition matrices and HTF alignment.

---

## Step 0: Pre-Scan — Fetch Top Volume Universe

Get the top Binance USDT pairs by 24h quote volume:

### 0a. Fetch Live from Binance API

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

### 0b. Alternative: Watchlist

If TradingView watchlist already contains the universe, use:

```
watchlist_get()
```

---

## Step 1: Run Markov Scan

Use the `coin_scan` MCP tool:

```
coin_scan(
  symbols: ["BINANCE:BTCUSDT", "BINANCE:ETHUSDT", ...],
  timeframe: "240",       # entry TF — 4H or 1H typical
  htf: "D",               # higher TF for trend context
  bars: 30,               # bars for Markov matrix
  volume_min: 5,          # $5M minimum avg volume
  top_n: 10               # return top 10 results
)
```

### What happens internally:

**1. Bar Data Acquisition** — Per symbol, switch chart to that symbol + entry TF, fetch OHLCV bars (default 30).

**2. Volume Filter** — Compute average daily volume in USD. If below `volume_min` (default $5M), skip.

**3. Volume Ratio** — avg volume of last 3 bars / avg volume of all bars. > 1.0 = recent volume expansion.

**4. State Classification** — Classify each bar's return into one of 5 Markov states:

| State | Label | Return Range |
|-------|-------|-------------|
| SS | Strong Bull | > +1.5% |
| SB | Weak Bull | +0.5% to +1.5% |
| N | Neutral | -0.5% to +0.5% |
| WB | Weak Bear | -1.5% to -0.5% |
| WS | Strong Bear | < -1.5% |

**5. Transition Matrix** — Build 5×5 probability matrix `P[i][j]` = probability of transitioning from state i to state j.

Example row: SS→{SS: 0.4, SB: 0.3, N: 0.2, WB: 0.05, WS: 0.05} = strong bull tends to continue strong or weak bull.

**6. Markov Metrics:**

| Metric | Formula | Meaning |
|--------|---------|---------|
| **Entropy** | `-Σ p * log₂(p)` per row, averaged | Unpredictability. Low (<1.0) = predictable path. Max 2.32. |
| **Momentum Persistence** | `(P(SS→SS) + P(SS→SB) + P(WS→WS) + P(WS→WB)) / 2` | How likely a strong move persists. 0-1. |
| **Directional Bias** | Σ(bullish transition probs) - Σ(bearish transition probs) | Net directional tendency. -1 to +1. |
| **Steady State** | π = πP (iterated to convergence) | Long-run equilibrium distribution over states. |
| **Trend Probability** | π(SS) + π(WS) | Probability of being in a trend state long-term. |
| **Total Move %** | `(close_last - close_first) / close_first * 100` | Net move over the period. |

**7. Reliability Score (0-1):**

```
reliability = persistence * 0.4 + entropy_score * 0.3 + bias_strength * 0.3
```

Where:
- persistence = momentum_persistence (0-1)
- entropy_score = max(0, 1 - avg_entropy / 2.32)
- bias_strength = min(|directional_bias| / 2, 1)

**8. Direction** — Based on last state:
- SS or SB → **BULL**
- WS or WB → **BEAR**
- N → **NEUTRAL**

**9. HTF Context (if htf param provided):**

Switch chart to HTF (e.g. D), compute:
- **Price vs 21-EMA**: ABOVE or BELOW
- **RSI Zone** (proxied): avg_return * 10 + 50. BULL > 55, BEAR < 45, NEUTRAL otherwise
- **MACD Signal**: 12/26 EMA crossover. BULL if line > signal
- **Trend**: majority vote of 3 signals (≥2 agree)

**10. MTF Score:**
```
mtf_score = reliability
if HTF trend == direction:    +0.20
if HTF trend opposes direction: -0.15
mtf_score = clamp(0, 1)
```

**11. Hidden Markov Model (HMM) Analysis:**

A 3-state Gaussian HMM (UP / DOWN / RANGE) is fitted via Baum-Welch (15 EM iterations) on the return series, with k-means initialization for the emission parameters.

| Metric | Description |
|--------|-------------|
| **HMM Regime** | Most likely hidden state at last bar: UP, DOWN, or RANGE |
| **HMM Direction** | Smoothed directional signal: BULL (UP state dominant), BEAR (DOWN state dominant), or NEUTRAL (RANGE) |
| **HMM Stability** | `1 - regime_changes / (T-1)` — how stable the hidden state path is. Higher = cleaner regime. |
| **State Probs** | Posterior probability of each hidden state at the last bar (up_pct, down_pct, range_pct) |

**HMM vs Markov comparison:**

| Aspect | Markov (observable) | HMM (hidden) |
|--------|--------------------|--------------|
| States | Based on single-bar returns (noisy) | Inferred from return distribution (smoothed) |
| Noise | Flags every >1.5% bar as "Strong" | Separates signal from noise via emission probs |
| Regime | No regime detection | Explicit UP/DOWN/RANGE regime |
| Stability | Not measured | `regime_stability` score |

**Interpretation:** If Markov says BULL and HMM says UP with high stability → strong alignment. If Markov says BULL but HMM says RANGE → the "bull" is likely noise within a range, not a sustained trend.

---

## Step 2: Filter Candidates

From the ranked results, evaluate:

| Signal | Strong | Weak | Skip |
|--------|--------|------|------|
| **MTF Score** | > 0.5 | 0.3-0.5 | < 0.3 |
| **Entropy** | < 1.0 (predictable) | 1.0-1.5 | > 1.5 (random walk) |
| **Reliability** | > 0.4 | 0.25-0.4 | < 0.25 |
| **Volume Ratio** | > 0.8 | 0.5-0.8 | < 0.5 |
| **HTF Alignment** | HTF trend = direction | HTF neutral | HTF opposite |

**Priority order:**
1. High MTF score + low entropy + HTF aligned = **PRIMARY CANDIDATE**
2. High reliability + HTF neutral = **SECONDARY** (check Mxwll levels)
3. HTF conflicting = **SKIP** unless volume ratio > 1.0 and entropy < 0.8

---

## Step 3: Visual Confirm (Top 1-2 Candidates)

For each top candidate:

```
chart_set_symbol("BINANCE:SOLUSDT")
chart_set_timeframe("60")     # entry TF
capture_screenshot(region: "chart")
```

**Kill signals:**
- Long wicks on most recent bar
- Volume spike then cliff on last bar
- Price curling toward VWAP
- Doji at extreme of run
- Consecutive bars with shrinking bodies

---

## Step 4: Deep Check with Mxwll

```
data_get_pine_lines(study_filter: "Mxwll Suite")
data_get_pine_labels(study_filter: "Mxwll Suite")
```

Check:
- How many Mxwll lines sit within 5-10% of current price?
- Is price approaching a labeled resistance/support?
- Structure labels (BoS, CHoCH, HH, LL) — confirm trend direction

| Overhead Lines | Impact |
|---------------|--------|
| 0 lines | CLEAR AIR — high confidence |
| 1-3 lines | MODERATE — expected levels |
| 4+ lines | DENSE ZONE — momentum likely stalls |

---

## Step 5: Report & Handoff

```
Rank | Symbol              Dir     MTFSc  Rel    Entropy  Persist  VolR  Move%  HTF_Trend  State        HMM_Reg    HMM_Stab  Priority
 1   | SOLUSDT             BULL      72    55     0.82    0.450   1.2  +8.4  BULL       Strong Bull  UP         0.833     PRIMARY
 2   | PEPEUSDT            BULL      61    48     1.10    0.380   0.9  +14.2 BULL       Weak Bull    RANGE      0.621     WATCH
```

| Column | Description |
|--------|-------------|
| Rank | Position by MTF score |
| Symbol | Trading pair |
| Dir | Direction from last state (BULL/BEAR/NEUTRAL) |
| MTFSc | mtf_score * 100 (0-100) |
| Rel | reliability * 100 (0-100) |
| Entropy | Average entropy across states (lower = more predictable) |
| Persist | Momentum persistence (0-1) |
| VolR | Volume ratio (last 3 bars / all bars avg) |
| Move% | Total net move over the period |
| HTF_Trend | Higher timeframe trend (BULL/BEAR/NEUTRAL) |
| State | Last state label (Strong Bull / Weak Bear / etc.) |
| HMM_Reg | HMM hidden regime (UP / DOWN / RANGE) — smoothed, less noisy |
| HMM_Stab | HMM regime stability (0-1) — higher = cleaner trend regime |
| Priority | PRIMARY / SECONDARY / WATCH / EDGE / SKIP |

Handoff top pick to chart-analyst for full institutional pipeline.

---

## Interpretation Guide

### What a Good Result Looks Like

```
Symbol: SOLUSDT     Dir: BULL    MTFSc: 72    Rel: 55    Entropy: 0.82
Persist: 0.450     VolR: 1.2    Move: +8.4%  HTF: BULL  State: Strong Bull
```

- MTF score > 0.5 = reliable signal
- Entropy < 1.0 = Markov path is predictable (low randomness)
- Persistence > 0.3 = strong moves tend to continue
- Vol Ratio > 1.0 = volume expanding (live interest)
- HTF aligned = tailwind from higher timeframe
- Move% < 20% = still room to run (not extended)

### What a Weak Result Looks Like

```
Symbol: DOGEUSDT    Dir: BULL    MTFSc: 31    Rel: 22    Entropy: 1.85
Persist: 0.150     VolR: 0.6    Move: +2.1%  HTF: NEUTRAL  State: Weak Bull
```

- MTF score < 0.4 = low conviction
- Entropy > 1.5 = near-random walk (no edge)
- Persistence < 0.2 = strong moves don't sustain
- Vol Ratio < 0.8 = volume drying up
- HTF neutral = no tailwind or headwind
- Skip — insufficient edge

---

## Execution Estimate

- Top 20 symbols: ~2-3 min (via coin_scan MCP tool)
- Visual confirm + Mxwll check for top 1-2: ~3-5 min
- **Total: ~5-8 min per scan session**
