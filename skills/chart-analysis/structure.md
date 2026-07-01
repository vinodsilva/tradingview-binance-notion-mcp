---
name: structure
description: Market structure, SMC, BOS/CHOCH/MSS, Order Blocks, Breakers, Mitigation Blocks, FVGs, Inverse FVGs, Premium/Discount Arrays, Liquidity Pools, Wyckoff phases A-E
---

# Structure — SMC & Wyckoff Phase Analysis

## Smart Money Concepts (SMC) — Structure Analysis

### Market Structure Shift (MSS) / Break of Structure (BOS)

Use `data_get_ohlcv(count=200)` to identify swing points.

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
    liquidity_sweep = "BULLISH"  # Buy-side liquidity grabbed

# Bearish — sweep of high  
if candle.high > prev_swing_high and candle.close < prev_swing_high:
    liquidity_sweep = "BEARISH"  # Sell-side liquidity grabbed
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

**Bullish FVG**: Three consecutive candles where:
- Candle 1 high < Candle 3 low (gap up)
- Gap between Candle 1 high and Candle 3 low is the FVG zone
- Price typically retraces to fill this gap before continuing up

**Bearish FVG**: Three consecutive candles where:
- Candle 1 low > Candle 3 high (gap down)
- Gap between Candle 1 low and Candle 3 high is the FVG zone

### Inverse Fair Value Gap (IFVG)

Same three-candle structure as FVG but the gap represents **inefficiency in the opposite direction** — a rejection rather than an invitation.

**Bearish IFVG**: Three candles where Candle 1 high < Candle 3 low (gap up), but price rejected the gap and closed back below. The unmitigated gap now acts as resistance.

**Bullish IFVG**: Three candles where Candle 1 low > Candle 3 high (gap down), but price rejected the gap and closed back above. The unmitigated gap now acts as support.

Detection rule: FVG formed in one direction, but the following candle closes back through and beyond the gap origin, invalidating the directional bias.

### Mitigation Block (MitB)

When price returns to an Order Block and "mitigates" it (breaks through the OB range), the OB structure is considered consumed/mitigated. After mitigation, the OB no longer holds as support/resistance — it becomes a **Mitigation Block**.

- **Bullish MitB**: A bullish OB that gets swept below (low broken). No longer valid as support. Price may still react at the level but with reduced probability.
- **Bearish MitB**: A bearish OB that gets swept above (high broken). No longer valid as resistance.

Detection: OB formed per rules above, then price retraces and breaks beyond the OB range (low for bullish OB, high for bearish OB).

### Breaker Block

A **Breaker** forms when an Order Block fails to hold and price breaks through it decisively, converting it into a level of opposition. Breakers represent a failed OB that flips polarity.

- **Bullish Breaker**: Bearish OB (last up-candle before a down move) where price breaks back above the OB high. The OB zone flips from resistance to support. Confirmation requires close > OB high with volume > 1.5x avg.
- **Bearish Breaker**: Bullish OB (last down-candle before an up move) where price breaks back below the OB low. The OB zone flips from support to resistance. Confirmation requires close < OB low with volume > 1.5x avg.

Breakers are higher conviction than MitBs because they signal a failed manipulation, not just a consumed level.

### Premium / Discount Arrays

Price oscillates between premium (expensive) and discount (cheap) zones relative to公允 value. Used to assess whether price offers favorable entries.

| Level | Zone | Bias |
|-------|------|------|
| Above VWAP | Premium | Expensive — prefer selling |
| Below VWAP | Discount | Cheap — prefer buying |
| Above EMA 200 | Premium (HTF) | Extended bullish — cautious |
| Below EMA 200 | Discount (HTF) | Oversold — cautious |
| Above daily open | Intraday premium | Favors shorts if HTF bearish |
| Below daily open | Intraday discount | Favors longs if HTF bullish |
| Above 0.618 Fib | Premium | Low R:R for entry |
| Below 0.382 Fib | Discount | High R:R for entry |
| Between 0.382-0.618 | Fair value | Optimal entry zone |

Multi-timeframe rule: LTF discount + HTF discount = strong buy zone. LTF premium + HTF premium = strong sell zone. LTF discount + HTF premium = trend pullback (buy the dip if structure supports).

### Liquidity Pools

Liquidity sits at levels where stop orders and pending orders cluster. Price is drawn to these zones before reversing.

**Types of liquidity:**

| Type | Location | Trigger |
|------|----------|---------|
| Buy-side (BSL) | Above swing highs, above range highs | Liquidity grab → reversal down |
| Sell-side (SSL) | Below swing lows, below range lows | Liquidity grab → reversal up |
| Trendline liquidity | Above/below trendline touches | Sweep of clustered stops at trendline |
| Double top/bottom | Equal highs/lows | Stops stacked at obvious levels |
| Channel liquidity | Above channel top, below channel bottom | Breakout trap → reversal |
| News-level liquidity | Around round numbers (100, 500, 1000) | Psychological clustering |

### Sweep vs Inducement vs Failed Sweep

This is the single most important distinction for accurate liquidity hunting. The framework must classify each liquidity interaction into one of three categories:

| Category | Definition | Detection | Reliability | Action |
|----------|------------|-----------|-------------|--------|
| **Liquidity Sweep** | Price takes out the level AND reverses same bar | High > prev_swing_high, close < prev_swing_high (bearish). Low < prev_swing_low, close > prev_swing_low (bullish). Volume > 1.5x avg on reversal bar. | **HIGH** — tradeable reversal | Enter on retest of swept level. Stop beyond the sweep wick. |
| **Liquidity Inducement** | Price approaches within ~0.5% of the level but DOES NOT take it out, then reverses | High within 0.5% of prev_swing_high but never trades through it. Low within 0.5% of prev_swing_low but never trades through it. Reversal candle has volume > 1.2x avg. | **MEDIUM** — early signal, needs confirmation | Wait for a second confirmation bar. Enter on next TF's sweep or BOS. Do NOT front-run. |
| **Failed Sweep** | Price takes out the level BUT closes back past it, continuing in the sweep direction | Candle takes out level, closes beyond it in the same direction, and the next 2+ bars continue the same direction. Volume > 1.5x avg on breakout bar. | **LOW to ZERO** — sweep failed; trend continues | Do NOT fade. Wait for retest as support/resistance. The level now flips polarity. |

**Detection code (bearish example):**
```python
if candle.high > prev_swing_high and candle.close < prev_swing_high:
    if volume > 1.5 * avg_volume:
        classification = "SWEEP"  # Reliable reversal signal
elif candle.high > prev_swing_high * 0.995 and candle.high < prev_swing_high and candle.close < prev_swing_high:
    classification = "INDUCEMENT"  # Trap. Needs confirmation.
elif candle.high > prev_swing_high and candle.close > prev_swing_high:
    classification = "FAILED_SWEEP"  # Trend continues. Do not fade.
```

### Sweep Quality Grading (Grade A/B/C)

Not all sweeps are equal. Grade every sweep to determine conviction level.

| Grade | Volume | Slippage | Tail Length | TF Level | Conviction |
|-------|--------|----------|-------------|----------|------------|
| **A** | >2.0x avg | <0.3% past level | Short wick, immediate reversal | Sweeps D or W level | **HIGH** — tradeable immediately |
| **B** | 1.5-2.0x avg | 0.3-1.0% past level | Medium wick, 1-2 bars to reverse | Sweeps 4H/6H level | **MEDIUM** — needs 1 bar confirm |
| **C** | <1.5x avg | >1.0% past level | Long tail, no immediate reversal | Sweeps 60 or lower | **LOW** — skip or quarter size |

**Grading rules:**
- A-grade sweeps can be traded counter to HTF trend at 0.5x size
- B-grade sweeps counter to HTF trend = NO TRADE (wait for HTF to align)
- C-grade sweeps = never trade alone, only as confirmation for HTF setup
- Any grade sweep IN the direction of HTF trend = add +1 grade bonus

**BTCUSDT example (58,076 sweep):**
- Volume: 2.09x ✓ (>2.0x) → A criteria met
- Slippage: swept 58,240 by 0.23% ✓ (<0.3%) → A criteria met
- Tail: single-bar reversal → A criteria met
- TF level: D-level swing (58K is multi-month range low) ✓ → A criteria met
- **Grade: A** — but counter to HTF bearish trend → -1 grade penalty → trade at 0.5x size with 60M confirmation required

**The XRPUSDT trap (example from 1.0092):**
- Price approaches swing high but never takes it out by more than a tick
- Reversal happens before the level — retail sees "failed breakout" and shorts too late
- The inducement traps both: longs who bought the breakout, and shorts who entered on the rejection
- Actual move: price sweeps the NEXT level down (the real liquidity grab) before reversing up

**Why SYNUSDT was not Phase E:**
- Low-cap parabolic markets do NOT follow Wyckoff distribution phases
- Price at ATH with expanding volume on every pullback = no distribution
- Distribution only occurs when volume contracts by >50% AND price stops making higher highs
- Shorting a parabolic low-cap before 2 consecutive TFs show CHOCH = guaranteed stop-out

### Multi-TF Liquidity Ladder

Liquidity stacks across timeframes. A W-level liquidity grab is worth 10 D-level grabs. Always identify which TF's liquidity is being targeted.

| TF | Liquidity Target | When Triggered | Reaction Magnitude |
|----|-----------------|----------------|--------------------|
| W | 3-6 month swing high/low | 20-50 point move | Trend reversal possible |
| D | Monthly swing high/low | 5-15 point move | Multi-day reversal |
| 6H/4H | Weekly swing high/low | 2-5 point move | Swing reversal |
| 60 | Daily swing high/low | 1-2 point move | Session reversal |
| 15 | 4-8 hour swing high/low | 0.5-1 point move | Scalp reversal |
| 5 | 1-2 hour swing high/low | 0.1-0.5 point move | Micro reversal |

**Liquidity Ladder Rules:**
- A 15M sweep into a W-level swing point = highest probability trade setup
- A 5M sweep alone with no higher TF target = noise — do not trade
- HTF liquidity (W/D) + LTF sweep (15/5) + LTF inducement = sniper entry
- Multiple TFs sweeping the same level = stacked liquidity = strong reversal
- A sweep that only takes one TF's level and ignores the next TF up = partial grab — expect a second leg

**Real-world example:**
- Price at 1.0000 where D swing high = 1.0092 and W swing high = 1.0500
- A 60M sweep of 1.0092 without triggering 1.0500 = D-level liquidity grab only
- Expected move: 5-15 points reversal, then resumption toward 1.0500
- This is why XRP at 1.0092 was an inducement, not a sweep — D-level was intact, W-level was still above

### Multi-Timeframe Structure Integration

| TF | Role | Key Signals |
|----|------|-------------|
| W | HTF direction | Major swing highs/lows, zone of interest, macro BOS/CHOCH |
| D | Medium-term bias | Primary OB/FVG zones, weekly structure context |
| 6H | Session context | Asia/London/US bias, daily OB structure |
| 4H | Swing structure | Intermediate OB/FVG, trend continuity |
| 60 | Execution bias | BOS/CHOCH, nearest OB, primary liquidity pools |
| 15 | Entry timing | Liquidity sweep, IFVG fill, mitigation |
| 5 | Precision entry | Micro sweep, last-bar confirmation, tight OB |

- HTF structure (W/D) + mid TF confirmation (6H/4H) + LTF liquidity sweep = highest probability
- Always identify W-level order block first, then look for D/6H/4H sweep into it
- 5M confirms the 15M read — don't trade 5M in isolation
- **No short at ATH until 2 consecutive TFs show CHOCH** — this eliminates parabolic fade errors
- **No long at ATL until 2 consecutive TFs show CHOCH** — same rule for bottoms
- **Sweep + inducement on same level from adjacent TFs = the highest probability reversal setup in the framework**

### Order Flow Imbalance

- **Imbalance up**: Candle body up > 2x body down of previous candle
- **Imbalance down**: Candle body down > 2x body up of previous candle

---

## Wyckoff Phase Analysis (Multi-Timeframe)

### Wyckoff Phase Identification

Wyckoff is inherently visual — these are heuristic signals, not deterministic rules. Use screenshots + visual inspection alongside these checks.

#### Phase A — Accumulation (Bottoming)

Signals (at least 2 of 3):
- Bar with range > 2x ATR and volume > 3x avg followed by narrow-range bars
- Price stops making lower lows (3 consecutive equal or higher lows)
- Single up-bar with volume > 1.5x avg that closes above 10-bar range high

#### Phase B — Accumulation (Building)

Signals:
- Price oscillates in a bounded range (range width < 5x ATR)
- Volume declining trend (each touch of range extremes has lower volume)

#### Phase C — Spring

Must pass ALL:
- Bar low < lowest low of preceding 20 bars
- Bar close > that same low (closes back inside range)
- Volume > 1.5x 20-bar avg
- Following 2 bars stay above the spring low

#### Phase D — Markup (Trend)

Signals:
- Break above range with volume > 1.5x avg
- Pullbacks on declining volume (< 0.8x avg)

#### Phase E — Distribution (Topping)

Mirror of accumulation:
- Bar with volume > 3x avg and narrow body (< 30% of range)
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
| BOS/CHOCH | All | `data_get_ohlcv(count=200, summary=false)` | Identify swing points, structure breaks |
| Order Blocks | Execution | `data_get_ohlcv(count=200, summary=false)` | Wide-range bar preceding strong move |
| FVG/IFVG | All | `data_get_ohlcv(count=200, summary=false)` | 3-candle gap detection |
| Premium/Discount | All | `data_get_study_values()` | VWAP bands distance |
| Liquidity Pools | All | `data_get_ohlcv(count=200, summary=false)` | Sweeps of prior swing points |
| Wyckoff | D/60 | `capture_screenshot(region="chart")` | Visual phase classification |
| Breakers/MitBs | Execution | `data_get_ohlcv(count=200, summary=false)` | OB mitigation + flip detection |
