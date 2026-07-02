---
name: _volume
description: VSA bar classification, scalping tape reading patterns, swing VSA divergence, RSI hidden + regular divergence detection
---

# Volume — VSA Bar-by-Bar Analysis

## Dependencies
- `_setup` → provides tf_data (ohlcv + study_values) on each TF

## Inputs
```
{
  "tf": "15" | "60" | "240" | "D" | "W",        // which timeframe this run targets
  "ohlcv": [{ time, open, high, low, close, volume }],  // summary=false, from setup tf_data
  "study_values": { rsi: float, atr: float }  // from setup data collection
}
```

Avg volume is computed internally from OHLCV data (20-bar SMA of volume).
RSI is also recomputed from close prices for divergence detection (does not rely solely on study_values).

## Multi-Timeframe Execution

Volume runs **once per TF**, producing TF-specific output. The `tf` field tags each run.

| TF | Analysis | Output Fields | Consumed By |
|----|----------|---------------|-------------|
| **Entry TF** (15, 5, 1) | VSA bar types 1-9, S1-S6 scalping, consecutive patterns, stop-hunt detection | `bars_classified[]`, `scalp_patterns[]`, `stop_hunts[]` | `_confluence` (scalp checklist), `_structure` (sweep vol) |
| **Higher TF** (60, 4H) | RSI divergence detection, dominant volume signature | `divergences[]`, `dominant_signature` | `_confluence` (divergence, trend health), `_structure` (BOS confirmation) |
| **Swing TF** (D, W) | Swing VSA patterns, long-range RSI divergence | `divergences[]` | `_confluence` (swing checklist) |

**Note:** Divergence detection requires 50+ bars of raw OHLCV data per TF. Run on at least entry TF + one higher TF (e.g., 15 + 60 for swing).

## Steps

### 1. Bar Classification Thresholds

| Metric | Threshold |
|--------|-----------|
| Wide spread | Range > 1.5x ATR(14) |
| Narrow spread | Range < 0.7x ATR(14) |
| High close | Close in top 33% of range |
| Low close | Close in bottom 33% of range |
| Mid close | Close in middle 34% of range |
| High volume | Volume > 1.5x 20-bar avg |
| Low volume | Volume < 0.7x 20-bar avg |

### 2. The 9 VSA Bar Types

| # | Spread | Close | Volume | Meaning |
|---|--------|-------|--------|---------|
| 1 | Wide | High | High | Strong upthrust. Trend move. |
| 2 | Wide | Low | High | Strong downthrust. Sell-off. |
| 3 | Wide | Mid | Low | Effort vs result divergence. Weak move. |
| 4 | Narrow | Mid | Low | Resting / consolidation. |
| 5 | Narrow | Mid | High | Absorption. Battle. Pending explosion. |
| 6 | Narrow | High | High | Professional buying. Hidden strength. |
| 7 | Narrow | Low | High | Professional selling. Hidden weakness. |
| 8 | Wide | High | Low | Upthrust on poor volume. Fakeout. |
| 9 | Wide | Low | Low | Downthrust on poor volume. Fakeout. |

### 3. VSA Divergence (Effort vs Result)

- **Bullish:** Wide spread + mid/low close + very high vol → selling effort yields no breakdown → BULLISH
- **Bearish:** Wide spread + mid/low close + very high vol (up bar) → buying effort yields no breakout → BEARISH

### 4. Scalping VSA Bar Types (S1-S6)

| # | Bar Look | Vol vs Avg | 5-Bar Context | Signal |
|---|----------|------------|---------------|--------|
| S1 | Small body, small wick | < 0.5x | In congestion | Dead tape. Do not trade. |
| S2 | Small body, small wick | > 2.0x | After wide-range bar | Absorption. Pinch point. |
| S3 | Wide range, close at high | > 2.0x | After S2 | Breakout triggered. Enter. |
| S4 | Wide range, close at low | > 2.0x | After trend up | Selling climax. Exit longs. |
| S5 | Normal range, close mid | < 0.5x | In trend | Pullback on low volume. Healthy. |
| S6 | Wide range, long wick | > 2.0x | At major level | Stop hunt. Watch for reversal. |

### 5. Scalping Consecutive Bar Patterns

| Pattern | Bars | Action |
|---------|------|--------|
| **Compression → Expansion** | 3+ S2 then S3 | Enter in S3 direction |
| **Stop Hunt → Absorption** | S6 at level, then S2 | Wait for S3 opposite |
| **Trending + S5** | S1/S5 in trend direction | Add on next S3 |
| **Climax + S4** | S4 at extreme (3x+ vol) | Exit all. Reverse on confirmation. |
| **Fake Break + Reclaim** | S6 past level, close opposite | Aggressive entry to swept level |

### 6. Stop-Hunt Detection

```python
# Sell-side (bullish)
if bar.low < level and bar.close > level and vol > 2.0 * avg and bar.close > bar.open:
    stop_hunt = True; direction = "LONG"
# Buy-side (bearish)
if bar.high > level and bar.close < level and vol > 2.0 * avg and bar.close < bar.open:
    stop_hunt = True; direction = "SHORT"
```

**Rules:** Must reclaim. Volume > 2x. Enter on FOLLOWING bar, not stop-hunt bar itself.

### 7. Swing VSA (Daily/Weekly)

| D/W Bar Description | Signal | Sizing |
|--------------------|--------|--------|
| 3+ narrow bars, declining vol at support | Compression. Reversal incoming. | Accumulate 25% |
| Wide-range up bar, 2x+ vol breaking resistance | Breakout confirmed | Add 50% |
| 1st pullback, declining vol (< 0.7x) | Healthy retest | Add 25% |
| 2nd pullback to 50% of move | Deep. Caution. | Hold only |
| Absorption cluster (3-5 bars) at resistance, high vol | Distribution. Top forming. | Reduce |
| Wide-range down bar, 3x+ vol at support | Climax. Exhaustion selling. | Begin accumulation |
| Lower low on lower vol vs prior low | Hidden bullish divergence | Accumulate |

### 8. Dominant Volume Signature

Classify the overall volume character of the analyzed section to determine the market's dominant force:

```python
def classify_dominant_signature(bars_classified):
    type_counts = {t: 0 for t in range(1, 10)}
    for b in bars_classified:
        type_counts[b["type"]] += 1
    total = len(bars_classified)

    impulse = (type_counts[1] + type_counts[2]) / total
    absorption = (type_counts[5] + type_counts[6] + type_counts[7]) / total
    compression = type_counts[4] / total

    if impulse > 0.35 and impulse > absorption and impulse > compression:
        return "IMPULSE"
    if absorption > 0.35 and absorption > impulse and absorption > compression:
        return "ABSORPTION"
    if compression > 0.45:
        return "COMPRESSION"
    return None
```

| Signature | Meaning | Trading Bias |
|-----------|---------|-------------|
| **IMPULSE** | Trending. Dominant bars are wide-range, high-vol. | Trade with trend. Avoid fading. |
| **ABSORPTION** | Battle. Large volume but price contained. | Prepare for breakout. Scale into direction of next impulse. |
| **COMPRESSION** | Resting. Low volume, narrow ranges. | Build watchlist. VCP forming. Explosion pending. |
| **null** | Mixed — no single signature dominates. | Default to regime direction with tighter stops. |

### 9. RSI Divergence Detection

Requires 50+ bars of OHLCV with close prices. RSI is computed from the OHLCV close data.

Four divergence types — classified by comparing consecutive swing highs/lows on price vs RSI:

#### Divergence Classification Matrix

| Type | Swing | Price | RSI | Context | Signal |
|------|-------|-------|-----|---------|--------|
| **Regular Bullish** | Swing Lows | LL | HL | Downtrend exhaustion | Reversal LONG |
| **Regular Bearish** | Swing Highs | HH | LH | Uptrend exhaustion | Reversal SHORT |
| **Hidden Bullish** | Swing Lows | HL | LL | Uptrend pullback | Continuation LONG |
| **Hidden Bearish** | Swing Highs | LH | HH | Downtrend pullback | Continuation SHORT |

#### Swing Point Detection

```python
def find_swing_highs(prices, lookback=2):
    return [i for i in range(lookback, len(prices)-lookback)
            if prices[i] == max(prices[i-lookback:i+lookback+1])]

def find_swing_lows(prices, lookback=2):
    return [i for i in range(lookback, len(prices)-lookback)
            if prices[i] == min(prices[i-lookback:i+lookback+1])]
```

#### RSI Calculation (14-period)

```python
def compute_rsi(closes, period=14):
    deltas = [closes[i] - closes[i-1] for i in range(1, len(closes))]
    gains = [d if d > 0 else 0 for d in deltas]
    losses = [-d if d < 0 else 0 for d in deltas]
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period
    rs = [avg_gain / avg_loss if avg_loss > 0 else 100]
    for i in range(period, len(deltas)):
        avg_gain = (avg_gain * (period-1) + gains[i]) / period
        avg_loss = (avg_loss * (period-1) + losses[i]) / period
        rs.append(avg_gain / avg_loss if avg_loss > 0 else 100)
    rsi = [100 - (100 / (1 + r)) for r in rs]
    return [None] * period + rsi
```

#### Detection Logic

```python
closes = [bar.close for bar in ohlcv]
rsi = compute_rsi(closes)
high_pivots = [(idx, closes[idx]) for idx in find_swing_highs(closes)]
low_pivots = [(idx, closes[idx]) for idx in find_swing_lows(closes)]

divergences = []

if len(high_pivots) >= 2:
    h2_px, h1_px = high_pivots[-1][1], high_pivots[-2][1]
    h2_r,  h1_r  = rsi[high_pivots[-1][0]], rsi[high_pivots[-2][0]]
    if h2_px > h1_px and h2_r < h1_r:  # Regular Bearish: HH price, LH RSI
        divergences.append({
            "type": "bearish_regular", "strength": min(abs(h2_r - h1_r) / 10, 3.0),
            "price_high_1": h1_px, "price_high_2": h2_px, "rsi_1": h1_r, "rsi_2": h2_r,
            "verdict": "reversal_short"
        })
    if h2_px < h1_px and h2_r > h1_r:  # Hidden Bearish: LH price, HH RSI
        divergences.append({
            "type": "bearish_hidden", "strength": min(abs(h2_r - h1_r) / 10, 3.0),
            "price_high_1": h1_px, "price_high_2": h2_px, "rsi_1": h1_r, "rsi_2": h2_r,
            "verdict": "continuation_short"
        })

if len(low_pivots) >= 2:
    l2_px, l1_px = low_pivots[-1][1], low_pivots[-2][1]
    l2_r,  l1_r  = rsi[low_pivots[-1][0]], rsi[low_pivots[-2][0]]
    if l2_px < l1_px and l2_r > l1_r:  # Regular Bullish: LL price, HL RSI
        divergences.append({
            "type": "bullish_regular", "strength": min(abs(l2_r - l1_r) / 10, 3.0),
            "price_low_1": l1_px, "price_low_2": l2_px, "rsi_1": l1_r, "rsi_2": l2_r,
            "verdict": "reversal_long"
        })
    if l2_px > l1_px and l2_r < l1_r:  # Hidden Bullish: HL price, LL RSI
        divergences.append({
            "type": "bullish_hidden", "strength": min(abs(l2_r - l1_r) / 10, 3.0),
            "price_low_1": l1_px, "price_low_2": l2_px, "rsi_1": l1_r, "rsi_2": l2_r,
            "verdict": "continuation_long"
        })
```

#### Divergence Strength Grading

| RSI Difference | Strength | Reliability |
|---------------|----------|-------------|
| < 5 pts | 1.0 | Weak — may be noise |
| 5-15 pts | 2.0 | Normal — tradeable |
| > 15 pts | 3.0 | Strong — high conviction |

#### Rules
- Hidden divergence = trend continuation — size up (strongest signal for trend trades)
- Regular divergence = trend reversal — needs volume confirmation at key level
- Check divergence on entry TF and one TF higher (e.g., 60 + 15 for swing)
- Ignore strength < 1.0
- RSI > 70 or < 30 during divergence increases reversal probability

## Output

```
{
  "bars_classified": [
    { "index": 0, "type": 1-9, "scalp_type": "S3" | null, "description": "Strong upthrust" }
  ],
  "scalp_patterns": [
    { "pattern": "Compression->Expansion", "direction": "long", "trigger_bar": 5 }
  ],
  "stop_hunts": [
    { "level": 1.0450, "direction": "LONG", "volume_ratio": 2.5, "wick_ratio": 0.4 }
  ],
  "divergences": [
    { "type": "bullish_hidden" | "bullish_regular" | "bearish_hidden" | "bearish_regular",
      "strength": 2.5,
      "price_high_1": 1.0500, "price_high_2": 1.0550,
      "rsi_1": 68.0, "rsi_2": 55.0,
      "verdict": "continuation_long" | "reversal_short" | "continuation_short" | "reversal_long"
    }
  ],
  "dominant_signature": "IMPULSE" | "ABSORPTION" | "COMPRESSION" | null
}
```

## Next Module
Pass `{ tf, bars_classified, scalp_patterns, stop_hunts, divergences, dominant_signature }` per TF → `_structure` (confirmation layer), `_confluence` (scoring)
