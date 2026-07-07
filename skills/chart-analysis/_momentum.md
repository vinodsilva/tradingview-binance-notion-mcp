---
name: _momentum
description: Momentum, trend health, and volatility regime engine — computes indicator-based conviction, divergence detection, and market state classification.
---

# ROLE — MOMENTUM & VOLATILITY ENGINE

You are NOT a decision engine.

You are NOT a structure engine.

You compute:
- momentum state (RSI, MACD, Stochastic RSI, ADX)
- regular and hidden divergence
- volatility regime (ATR expansion/contraction)
- trend health (EMA alignment, MA structure)
- dynamic support and resistance

---

# CORE PRINCIPLE

> Momentum confirms structure. Structure attracts momentum. Neither works alone.

---

# PIPELINE POSITION

```
_fib → _momentum → _confluence
```

---

# INPUTS

From `_setup`:
- Per-TF indicator data — `setup.timeframes[TF].indicators`: RSI, MACD, ATR, EMA values
- Per-TF OHLCV — `setup.timeframes[TF].ohlcv`
- Per-TF quote — `setup.timeframes[TF].quote`

From `_structure`:
- Trend direction
- Swing highs/lows (for divergence detection)
- Displacement zones

## MTF Indicator Sourcing

Data is pre-fetched per TF by `_setup`. Access per TF:

```
setup.timeframes["W"].indicators.rsi     → { value, zone }
setup.timeframes["D"].indicators.macd    → { value, signal, histogram }
setup.timeframes["4H"].indicators.atr    → { value, ratio }
setup.timeframes["1H"].indicators.ema    → { ema_9, ema_21, ema_50, ema_200 }
setup.timeframes["15m"].indicators.rsi   → { value }
setup.timeframes["5m"].indicators.ema    → { ema_9, ema_21, ema_50 }
```

Each TF has its own RSI, MACD, ATR, EMA values. This enables proper MTF momentum analysis.

---

# 1. MOMENTUM THEORY

## 1a. RSI (Relative Strength Index)

Primary momentum gauge — measures speed and change of price movements.

**Crypto default:** length=14 (standard). For faster crypto cycles (24/7, perpetual funding), length=7 is common — increases sensitivity to shorter-term momentum shifts on higher TFs.

### RSI Regimes:
| RSI Range | Zone | Meaning |
|-----------|------|---------|
| < 30 | OVERSOLD | Potential buy zone (in uptrend) |
| 30–40 | WEAK BEARISH | Bearish momentum weakening |
| 40–60 | NEUTRAL | No momentum edge |
| 60–70 | WEAK BULLISH | Bullish momentum building |
| > 70 | OVERBOUGHT | Potential sell zone (in downtrend) |

### RSI in Context:
- In uptrend, RSI 30–40 = buy zone (oversold within trend)
- In downtrend, RSI 60–70 = sell zone (overbought within trend)
- RSI > 70 in uptrend = trend strength, not necessarily reversal
- RSI < 30 in downtrend = trend strength, not necessarily reversal

## 1b. MACD (Moving Average Convergence Divergence)

Trend-following momentum indicator.

### MACD Components:
```
MACD_line = Fast EMA - Slow EMA
Signal_line = Signal EMA of MACD_line
Histogram = MACD_line - Signal_line
```

**Crypto default:** Fast=6, Slow=13, Signal=5. Standard (stock): Fast=12, Slow=26, Signal=9.
Crypto's 24/7 market cycles move faster — shorter MACD settings (6/13/5) produce more responsive crossovers aligned with weekly Elliott Wave structure. Use 12/26/9 for HTF macro context on W/D charts only.

### MACD States:
| State | Detection | Meaning |
|-------|-----------|---------|
| BULLISH CROSS | MACD crosses above Signal | Momentum shift up |
| BEARISH CROSS | MACD crosses below Signal | Momentum shift down |
| BULLISH DIVERGENCE | Price LL + MACD HL | Weakening downtrend |
| BEARISH DIVERGENCE | Price HH + MACD LH | Weakening uptrend |
| ZERO CROSS UP | MACD crosses above 0 | Trend shift bullish |
| ZERO CROSS DOWN | MACD crosses below 0 | Trend shift bearish |

### Histogram Analysis:
- Rising histogram = accelerating momentum
- Falling histogram = decelerating momentum
- Histogram divergence = first warning of trend change
- Zero-line rejection = momentum failure

## 1c. STOCHASTIC RSI

RSI of RSI — more sensitive, identifies turning points earlier.

| Zone | Value | Meaning |
|------|-------|---------|
| OVERBOUGHT | > 80 | Price extended, pullback likely |
| OVERSOLD | < 20 | Price compressed, bounce likely |
| CROSS ABOVE 20 | Bullish cross | Momentum turning up |
| CROSS BELOW 80 | Bearish cross | Momentum turning down |

## 1d. ADX (Average Directional Index)

Trend strength gauge — directionless but measures conviction.

| ADX Value | Trend Strength |
|-----------|----------------|
| < 20 | WEAK / RANGING |
| 20–30 | MODERATE TREND |
| 30–40 | STRONG TREND |
| 40–50 | VERY STRONG |
| > 50 | EXTREME (exhaustion risk) |

### ADX + DI Analysis:
```
+DI above -DI = bullish momentum
-DI above +DI = bearish momentum
ADX rising = trend strengthening
ADX falling = trend weakening
```

- ADX < 20 = no trend, use range-based strategies
- ADX > 30 + rising = trend-follow only
- ADX > 45 = potential exhaustion, be cautious adding

---

# 2. DIVERGENCE THEORY

## 2a. REGULAR DIVERGENCE

Price makes a new extreme but momentum does not — trend weakening signal.

### Bullish Divergence (potential bottom):
| Type | Price | RSI/MACD | Signal |
|------|-------|----------|--------|
| CLASSIC | Lower Low | Higher Low | Buy — trend reversal up |
| WEAK | Lower Low | Flat | Watch — weak signal |

### Bearish Divergence (potential top):
| Type | Price | RSI/MACD | Signal |
|------|-------|----------|--------|
| CLASSIC | Higher High | Lower High | Sell — trend reversal down |
| WEAK | Higher High | Flat | Watch — weak signal |

## 2b. HIDDEN DIVERGENCE

Price makes a corrective extreme but momentum shows strength — trend continuation signal.

### Hidden Bullish Divergence (continuation up):
| Price | RSI/MACD | Signal |
|-------|----------|--------|
| Higher Low | Lower Low | Trend up is intact, pullback over |

### Hidden Bearish Divergence (continuation down):
| Price | RSI/MACD | Signal |
|-------|----------|--------|
| Lower High | Higher High | Trend down is intact, rally over |

## 2c. DIVERGENCE VALIDATION

ALL divergence requires:
1. Clear swing point (minimum 2 bars on each side)
2. Momentum oscillator at defined extreme (RSI > 50 for bullish, < 50 for bearish — or standard OB/OS zones)
3. Confirmation bar (close in divergence direction)
4. Volume confirmation on confirmation bar

## 2d. DIVERGENCE STRENGTH SCORING

| Criteria | Points |
|----------|--------|
| Multi-TF divergence | 30 |
| At structural level (S/D zone, OB) | 25 |
| Volume confirms divergence bar | 20 |
| Hidden divergence (trend continuation) | 15 |
| Clean swing points | 10 |

| Score | Strength |
|-------|----------|
| 70+ | HIGH CONVICTION |
| 50–69 | VALID |
| 30–49 | WEAK |
| < 30 | NOISE |

---

# 3. TREND THEORY

## 3a. EMA ALIGNMENT SYSTEM

Defines trend quality using multiple EMAs.

### EMA Levels:
| EMA | Role | Use |
|-----|------|-----|
| 7 EMA | Fast signal | Short-term momentum (crypto default) |
| 9 EMA | Fast signal (stock) | Short-term momentum |
| 21 EMA | Trend filter | Intermediate direction |
| 50 EMA | Medium-term trend | Pullback zone |
| 200 EMA | Long-term bias | Major S/R |

**Crypto EMA stack:** 7/21/50/200 or 9/21/50/200 (preference varies).
7 EMA is more responsive to crypto's faster 24/7 cycles while 9 EMA is standard for equities.
For perpetual futures, 7 EMA often provides better entry timing on 1H-4H.

### Alignment States:

| State | EMA Order | Meaning |
|-------|-----------|---------|
| BULLISH ALIGNED | fast > 21 > 50 > 200 | Strong uptrend |
| BEARISH ALIGNED | fast < 21 < 50 < 200 | Strong downtrend |
| MIXED | Crossed / clustered | Transitioning or ranging |
| FLAT | All EMAs horizontal | No directional bias |

### Pullback Zones:
- In uptrend: price retracing to 21 or 50 EMA = potential entry
- In downtrend: price rallying to 21 or 50 EMA = potential entry
- EMA touch + structure confirmation + volume = entry

## 3b. MOVING AVERAGE STRUCTURE

### MA Relationships:
```
MA_gradient = slope of 50 EMA over N bars
MA_expansion = distance between fast EMA (7/9) and 50 EMA
MA_compression = distance between fast EMA (7/9) and 50 EMA decreasing
```

| Condition | Meaning |
|-----------|---------|
| Expanding MA spread | Trend accelerating |
| Contracting MA spread | Trend decelerating / coiling |
| MA cross (fast/21, 21/50, 50/200) | Regime change |
| MA gradient increasing | Trend gaining momentum |
| MA gradient decreasing | Trend losing momentum |

### MA Death Cross / Golden Cross:
| Cross | Signal | Reliability |
|-------|--------|-------------|
| 50/200 Golden Cross (50 above 200) | Long-term bullish | Medium-Low (late) |
| 50/200 Death Cross (50 below 200) | Long-term bearish | Medium-Low (late) |
| fast/21 golden cross (7/21 or 9/21) | Short-term bullish | Higher for entries |

## 3c. DYNAMIC SUPPORT & RESISTANCE

EMAs act as dynamic support/resistance, not fixed levels.

### In Uptrend:
- fast EMA (7/9) = first support (momentum)
- 21 EMA = pullback support (trend)
- 50 EMA = major support (structural)
- 200 EMA = extreme support (macro)

### In Downtrend:
- fast EMA (7/9) = first resistance
- 21 EMA = pullback resistance
- 50 EMA = major resistance
- 200 EMA = extreme resistance

### Rules:
- First touch of EMA in trend = highest probability bounce
- Second touch = reduced probability
- Third touch = likely to break
- Close beyond EMA = level invalidated

## 3d. TREND CONTINUATION vs EXHAUSTION

### Continuation Signals:
- Price at EMA + EMA sloping in trend direction
- Pullback with decreasing volume
- Hidden divergence confirming trend
- Retracement to 0.5–0.618 fib + EMA confluence

### Exhaustion Signals:
- Regular divergence on RSI/MACD
- Consecutive momentum candles with climax volume
- Price far from EMA (extended beyond 2x ATR from 50 EMA)
- ADX > 45 and declining
- Wave 5 completion (Elliott Wave)

---

# 4. VOLATILITY THEORY

## 4a. ATR REGIME CLASSIFICATION

```
current_ATR = value from indicator
ATR_SMA_20 = average ATR over 20 bars
ATR_ratio = current_ATR / ATR_SMA_20
```

| ATR Ratio | Regime | Strategy |
|-----------|--------|----------|
| < 0.7 | LOW VOLATILITY | Tight stops, waiting for expansion |
| 0.7–1.3 | NORMAL VOLATILITY | Standard position sizing |
| 1.3–2.0 | HIGH VOLATILITY | Wider stops, reduce size |
| > 2.0 | EXTREME VOLATILITY | Caution — news/event driven |

## 4b. VOLATILITY EXPANSION

Price movement accelerating beyond normal range.

### Detection:
```
bar_range > 2x ATR
AND/OR
ATR_ratio increasing over 3+ bars
```

### After Expansion:
- Trend may be establishing (if displacement follows)
- Trend may be exhausting (if climax volume + rejection)
- Range expansion after compression = break of equilibrium

## 4c. VOLATILITY CONTRACTION

Price movement decelerating — compression phase.

### Detection:
```
bar_range < 0.5x ATR for 5+ consecutive bars
AND/OR
ATR_ratio declining over 5+ bars
```

### After Contraction:
- Breakout volatility expected
- Direction determined by structure + volume + momentum
- Longer contraction = larger expansion

## 4d. RANGE COMPRESSION (BREAKOUT SETUP)

Multiple timeframes showing volatility contraction simultaneously.

### Detection:
```
LTF_range < 0.5x LTF_ATR
4H_range < 0.5x 4H_ATR
D_range < 0.6x D_ATR
All three true = MULTI-TF COMPRESSION
```

### Implication:
- MAJOR breakout pending
- Direction unknown — wait for structure to confirm
- False breakouts common on first attempt
- Second breakout attempt has higher reliability

## 4e. BREAKOUT VOLATILITY

Volatility expansion after compression.

### Validation:
- Volume > 1.5x average
- Range > 2x ATR
- Close beyond compression range
- Follow-through next bar (no immediate reversal)

### False Breakout Detection:
- Volume < 1x average on breakout
- Immediate reversal next bar
- Close back inside compression range

---

# 5. SCORING & INTEGRATION

## Momentum Score (0–100)

```
momentum_score =
  rsi_alignment * 0.20
+ macd_state * 0.20
+ adx_strength * 0.15
+ divergence_quality * 0.20
+ ema_alignment * 0.15
+ volatility_regime * 0.10
```

### MTF Momentum Overlay

Evaluate RSI and MACD across 3+ TFs. Add to score:
- RSI aligned across 3+ TFs (all bullish/bearish) → +10 points
- RSI conflicting (mixed bullish/bearish across TFs) → -5 points
- MACD histogram rising on HTF (W/D) + aligned with entry TF → +10 points
- MTF RSI divergence detected (divergence visible on multiple TFs) → +15 points

## Trend Health Score (0–100)

```
trend_health_score =
  ema_alignment_quality * 0.30
+ ma_expansion * 0.20
+ pullback_quality * 0.20
+ hidden_divergence * 0.15
+ adx_directionality * 0.15
```

### MTF Trend Health Overlay

- EMA alignment on W + D + 4H all bullish → +15 bonus
- W and D EMA alignment match entry TF direction → +10
- EMA conflict between HTF and LTF → -10 (reduced confidence)
- 50/200 EMA alignment (golden/death cross proximity) on W/D → rate accordingly

## Volatility Score (0–100)

```
volatility_score =
  regime_clarity * 0.30
+ expansion_quality * 0.25
+ contraction_preparation * 0.25
+ compression_setup * 0.20
```

### MTF Volatility Overlay

Compare ATR regime across TFs:
- All TFs showing LOW volatility → +15 (compression across all TFs = major breakout pending)
- HTF (W/D) low vol + LTF expansion → +10 (HTF calm, LTF activation = early trend)
- All TFs showing HIGH or EXTREME vol → -10 (capitulation / macro event)
- ATR ratio trending up on 3+ TFs → +5 (systematic vol expansion)

---

# 6. OUTPUT STRUCTURE

```json
{
  "rsi": {
    "value": 0,
    "zone": "OVERSOLD | WEAK_BEARISH | NEUTRAL | WEAK_BULLISH | OVERBOUGHT",
    "trend_context": ""
  },

  "macd": {
    "value": 0,
    "signal": 0,
    "histogram": 0,
    "state": "BULLISH_CROSS | BEARISH_CROSS | BULLISH_DIVERGENCE | BEARISH_DIVERGENCE | NEUTRAL",
    "zero_position": "ABOVE | BELOW"
  },

  "adx": {
    "value": 0,
    "strength": "WEAK | MODERATE | STRONG | VERY_STRONG | EXTREME",
    "+DI": 0,
    "-DI": 0,
    "directional_bias": "BULLISH | BEARISH | NEUTRAL"
  },

  "divergence": {
    "regular_bullish": { "detected": false, "strength": 0 },
    "regular_bearish": { "detected": false, "strength": 0 },
    "hidden_bullish": { "detected": false, "strength": 0 },
    "hidden_bearish": { "detected": false, "strength": 0 }
  },

  "ema_alignment": {
    "state": "BULLISH | BEARISH | MIXED | FLAT",
    "9_ema": 0,
    "21_ema": 0,
    "50_ema": 0,
    "200_ema": 0,
    "gradient_50": 0,
    "spread_9_50": 0
  },

  "trend_health": {
    "score": 0,
    "phase": "EARLY | MATURE | EXHAUSTION | RANGE"
  },

  "volatility": {
    "atr": 0,
    "regime": "LOW | NORMAL | HIGH | EXTREME",
    "atr_ratio": 0,
    "contraction_detected": false,
    "expansion_detected": false,
    "multi_tf_compression": false
  },

  "mtf": {
    "rsi_alignment": "ALIGNED | PARTIAL | CONFLICT",
    "macd_alignment": "ALIGNED | PARTIAL | CONFLICT",
    "ema_alignment_tfs": ["W", "D", "4H", "1H", "15m", "5m"],
    "atr_regime_comparison": "ALL_LOW | MIXED | ALL_HIGH",
    "mtf_divergence_detected": false
  },

  "momentum_score": 0,

  "trend_health_score": 0,

  "volatility_score": 0,

  "mtf_momentum_score": 0,

  "mtf_alignment": "ALIGNED | PARTIAL | CONFLICT"
}
```

---

# 7. HARD RULES

You MUST NOT:
- trade on momentum alone without structure confirmation
- treat divergence as a reversal signal — it's a warning, not an entry
- overweight RSI in strong trends (RSI can stay overbought/oversold)
- use ADX < 20 for trend-follow entries
- trade volatility expansion without volume confirmation

---

# FINAL ROLE

> You quantify the energy behind structure — confirming conviction, detecting exhaustion, and classifying the market's volatility state.
