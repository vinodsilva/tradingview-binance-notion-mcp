---
name: structure
description: Market structure, SMC, BOS/CHOCH/MSS, Order Blocks, FVGs, Inverse FVGs, Premium/Discount, Liquidity Pools, Wyckoff phases A-E
---

# Structure — SMC & Wyckoff Phase Analysis

## Smart Money Concepts (SMC) — Structure Analysis

### Market Structure Shift (MSS) / Break of Structure (BOS)

Use `data_get_ohlcv(count=100)` to identify swing points.

**Bullish BOS** (uptrend):
- Price breaks above previous swing high with volume > 1.5x avg
- Confirms trend continuation
- Entry on retest of broken resistance as support

**Bearish BOS** (downtrend):
- Price breaks below previous swing low with volume > 1.5x avg
- Confirms trend continuation
- Entry on retest of broken support as resistance

**CHOCH** (Change of Character — trend reversal):
- Price breaks the last swing point in opposite direction
- Must be confirmed by volume expansion
- Invalidates current trend bias

### Liquidity Sweep Detection

```python
# Bullish — sweep of low
if candle.low < prev_swing_low and candle.close > prev_swing_low:
    liquidity_sweep = "BULLISH"  # Sell-side liquidity grabbed

# Bearish — sweep of high
if candle.high > prev_swing_high and candle.close < prev_swing_high:
    liquidity_sweep = "BEARISH"  # Buy-side liquidity grabbed
```

### Order Block (OB) Detection

**Bullish OB** (last down candle before strong up move):
- Prior downtrend candle with wide range + large body
- Immediately followed by strong up bar with volume > 1.5x avg
- Entry zone: within OB range (high to low of the down candle)

**Bearish OB** (last up candle before strong down move):
- Prior uptrend candle with wide range + large body
- Immediately followed by strong down bar with volume > 1.5x avg
- Entry zone: within OB range (high to low of the up candle)

### Fair Value Gap (FVG) Detection

**Bullish FVG**: Three consecutive candles where Candle 1 high < Candle 3 low (gap up). Gap between Candle 1 high and Candle 3 low is the FVG zone.

**Bearish FVG**: Three consecutive candles where Candle 1 low > Candle 3 high (gap down). Gap between Candle 1 low and Candle 3 high is the FVG zone.

### Inverse Fair Value Gap (IFVG)

Same three-candle structure as FVG but the gap represents inefficiency in the opposite direction — a rejection rather than an invitation.

**Bearish IFVG**: Gap up (C1 high < C3 low) but price rejected it and closed back below. Gap acts as resistance.

**Bullish IFVG**: Gap down (C1 low > C3 high) but price rejected it and closed back above. Gap acts as support.

### Premium / Discount Arrays

| Level | Zone | Bias |
|-------|------|------|
| Above VWAP | Premium | Expensive — prefer selling |
| Below VWAP | Discount | Cheap — prefer buying |
| Above EMA 200 | Premium (HTF) | Extended bullish — cautious |
| Below EMA 200 | Discount (HTF) | Oversold — cautious |
| Above 0.618 Fib | Premium | Low R:R for entry |
| Below 0.382 Fib | Discount | High R:R for entry |
| Between 0.382-0.618 | Fair value | Optimal entry zone |

### Sweep vs Inducement vs Failed Sweep

| Category | Definition | Detection | Reliability | Action |
|----------|------------|-----------|-------------|--------|
| **Liquidity Sweep** | Price takes out level AND reverses same bar | High > prev_swing_high, close < prev_swing_high (bearish). Volume > 1.5x avg on reversal. | **HIGH** | Enter on retest of swept level. Stop beyond sweep wick. |
| **Liquidity Inducement** | Price approaches within ~0.5% of level but does NOT take it out, then reverses | High within 0.5% of prev_swing_high but never trades through it. Reversal with vol > 1.2x avg. | **MEDIUM** | Wait for 1 bar confirmation. Do not front-run. |
| **Failed Sweep** | Price takes out level BUT closes past it, continuing in sweep direction | Takes out level, closes beyond it, next 2+ bars continue same direction. Vol > 1.5x avg. | **LOW** | Do NOT fade. Wait for retest. Level flips polarity. |

### Sweep Quality Grading (Grade A/B/C)

| Grade | Volume | Slippage | Tail Length | TF Level | Conviction |
|-------|--------|----------|-------------|----------|------------|
| **A** | >2.0x avg | <0.3% past level | Short wick, immediate reversal | Sweeps D or W level | **HIGH** |
| **B** | 1.5-2.0x avg | 0.3-1.0% past level | Medium wick, 1-2 bars to reverse | Sweeps 4H level | **MEDIUM** |
| **C** | <1.5x avg | >1.0% past level | Long tail, no immediate reversal | Sweeps 60 or lower | **LOW** |

**Grading rules:**
- A-grade sweeps counter to HTF trend = tradeable at 0.5x size
- B-grade sweeps counter to HTF trend = NO TRADE
- C-grade sweeps = never trade alone
- Any grade sweep IN direction of HTF trend = add +1 grade bonus

### Multi-Timeframe Structure Integration

| TF | Role | Key Signals |
|----|------|-------------|
| W | HTF direction | Major swing highs/lows, macro BOS/CHOCH |
| D | Medium-term bias | Primary OB/FVG zones, weekly structure |
| 4H | Swing structure | Intermediate OB/FVG, trend continuity |
| 60 | Execution bias | BOS/CHOCH, nearest OB, liquidity pools |
| 15 | Entry timing | Liquidity sweep, IFVG fill |

---

## Wyckoff Phase Analysis

Wyckoff is inherently visual — use screenshots + visual inspection alongside these checks.

#### Phase A — Accumulation (Bottoming)
Signals (at least 2 of 3):
- Bar with range > 2x ATR and volume > 3x avg followed by narrow-range bars
- Price stops making lower lows (3 consecutive equal or higher lows)
- Single up-bar with volume > 1.5x avg closing above 10-bar range high

#### Phase B — Building
- Price oscillates in a bounded range with declining volume

#### Phase C — Spring
Must pass ALL:
- Bar low < lowest low of preceding 20 bars
- Bar close > that same low
- Volume > 1.5x avg
- Following 2 bars stay above spring low

#### Phase D — Markup
- Break above range with volume > 1.5x avg
- Pullbacks on declining volume

#### Phase E — Distribution
- Bar with volume > 3x avg and narrow body
- Up bars show declining volume trend
- Final bar closes below 10-bar range low

### Wyckoff Position Sizing

| Phase | Action | Size |
|-------|--------|------|
| A (climax) | No position | 0 |
| B (building) | Accumulate | 25% |
| C (spring) | Add on confirmation | 50% |
| D (markup) | Pyramiding | 100% |
| E (distribution) | Reduce / trail | Exit 50% |

### Multi-Timeframe MCP Tool Reference

| Concept | TF | MCP Tool | How |
|---------|----|----------|-----|
| BOS/CHOCH | All | `data_get_ohlcv(count=100, summary=false)` | Identify swing points, structure breaks |
| Order Blocks | Execution | `data_get_ohlcv(count=100, summary=false)` | Wide-range bar preceding strong move |
| FVG/IFVG | All | `data_get_ohlcv(count=100, summary=false)` | 3-candle gap detection |
| Premium/Discount | All | `data_get_study_values()` | VWAP bands distance |
| Liquidity Pools | All | `data_get_ohlcv(count=100, summary=false)` | Sweeps of prior swing points |
| Wyckoff | D/60 | `capture_screenshot(region="chart")` | Visual phase classification |
