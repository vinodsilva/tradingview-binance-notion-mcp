---
name: _structure
description: Institutional market structure engine — OHLCV + Mxwll combined structure computation with liquidity, BOS/CHoCH, displacement, and multi-TF bias.
---

# ROLE — STRUCTURE ENGINE

You interpret market structure from validated data.

You compute:

- trend
- liquidity
- BOS / CHoCH
- displacement
- structure validity

---

# PIPELINE POSITION

```
_volume → _supply_demand → _structure → _fib → _momentum → _confluence
```

---

# INPUTS

## PRIMARY SOURCES (COMBINED)

### OHLCV
- Price bars (all TFs)
- Swing highs/lows from price action

### Mxwll Suite
- Structure labels: HH/HL/LH/LL, BoS, CHoCH
- Horizontal levels: swing points, fib levels, zone boundaries
- Session context table

## CONTEXT
Supply & Demand zones from `_supply_demand`

---

# CORE RULE

> OHLCV + Mxwll together define structure. S/D zones inform context.

Both are primary. Mxwll labels provide pre-computed swing structure (HH/HL/LH/LL) and BOS/CHoCH signals. Cross-reference Mxwll labels against raw OHLCV for each decision. When they agree = high confidence. When Mxwll is ambiguous, fall back to raw OHLCV structure.

---

# 1. TREND ENGINE

- HH + HL → UP
- LH + LL → DOWN
- mixed → RANGE
- failure → TRANSITION

## Trend Continuation Rules:
- UP: each HH higher than prior, each HL higher than prior HL
- DOWN: each LH lower than prior, each LL lower than prior LL
- Continuation confirmed when BOS in trend direction with displacement

## Trend Reversal Rules:
- Failed HH (lower high after trend up) → potential reversal
- Failed LL (higher low after trend down) → potential reversal
- Requires CHoCH + displacement to confirm reversal

## Expansion vs Pullback:
- Expansion = impulsive move (BOS with displacement)
- Pullback = corrective move (retracement, lower volume)
- Compression = narrowing range (volatility contraction, breakout pending)

---

# 2. STRUCTURE ENGINE

## BOS
- close beyond structure level
- displacement required

## CHoCH
- structure flip after trend break
- must confirm displacement

## MSS
- CHoCH + retest + continuation

## Structure Quality:
| Quality | Criteria |
|---------|----------|
| CLEAN | No overlapping structure breaks, clear swing points |
| MESSY | Tight swings, overlapping ranges, multiple failed breaks |
| TRANSITIONAL | Between trends, unclear direction |

## CISD (Change In State of Direction)

The inflection point where market structure transitions from one directional bias to another. CISD is the zone, not a single price.

### CISD Signals (convergence required)

| Signal | Bullish | Bearish |
|--------|---------|---------|
| HTF Liquidity Sweep | Sell-side swept, reclaimed | Buy-side swept, rejected |
| CHoCH | Breaks prior LH structure | Breaks prior HL structure |
| BOS + Retest | BOS up, retest holds | BOS down, retest rejects |
| RSI Regime Shift | Crosses above 50 from below | Crosses below 50 from above |
| Volume | Expansion on reclaim bars | Expansion on rejection bars |

### CISD Confirmation Levels

| CISD Phase | Price Action | Action |
|------------|-------------|--------|
| EARLY (Phase 1) | HTF sweep + first reclaim | Monitor, no entry |
| CONFIRMING (Phase 2) | CHoCH + BOS in new direction | Partial entry |
| ESTABLISHED (Phase 3) | MSS + HTF alignment | Full conviction entry |
| FAILED | Price back through CISD zone | Abort, reassess |

### CISD Zone Rules
- CISD zone = the price range where 3+ signals overlap within reasonable range
- Fewer than 3 signals = NOISE, not CISD
- Sweep without displacement = TRAP, not CISD
- CISD is only valid on the timeframe where the sweep occurred
- Once CISD is confirmed, invalidation is a close beyond the sweep level

---

# 3. LIQUIDITY ENGINE

## Types:
- External (HTF highs/lows, W/D levels)
- Internal (equal highs/lows, consolidation levels)
- Session (Asian high/low, European high/low, American high/low)

## RULE:
- liquidity must be swept BEFORE continuation
- No sweep = no confirmation of intent

---

# SWEEP RULE

Valid sweep only if:
- level taken (wick or close beyond)
- price returns inside within 1-2 bars
- displacement follows

---

# 4. LIQUIDITY THEORY — DEEP ANALYSIS

## 4a. LIQUIDITY POOLS

| Pool | Location | Target |
|------|----------|--------|
| Buy-side (BSL) | Above swing highs, EQHs | Stop losses of shorts |
| Sell-side (SSL) | Below swing lows, EQLs | Stop losses of longs |

## 4b. INTERNAL vs EXTERNAL LIQUIDITY

| Type | Definition | Strength |
|------|------------|----------|
| Internal | Within visible range (EQH/EQL on 1H or lower) | Low-Medium |
| External | Beyond visible range (HTF swing points) | HIGH |
| Session | Asian/European/American range extremes | Medium-High |

## 4c. SWEEP vs GRAB

| Move | Definition | Signal |
|------|------------|--------|
| SWEEP | Takes liquidity, immediate reversal | HIGH REVERSAL SIGNAL |
| GRAB | Takes liquidity, continues further | Weak — may be trend continuation |

### Distinction:
- Sweep = liquidity taken AND price closes back inside the range = reversal setup
- Grab = liquidity taken AND price closes beyond = stop run + continuation

## 4d. LIQUIDITY VOIDS

A price zone with minimal trading (low volume node / LVN).

```
void_high = top of LVN
void_low = bottom of LVN
```

- Price moves through voids quickly (no resistance/support)
- Price may accelerate through voids
- Voids often get filled later (return to fill the gap)

## 4e. LIQUIDITY VACUUM

Accelerated price movement through an LVN or single-print zone without reaction.

- Indicates urgency / institutional aggression
- Often followed by a deep retracement to "balance the auction"
- Creates FVG at vacuum boundaries

## 4f. RESTING ORDERS

Orders placed at specific levels waiting to be filled.

Detection:
- Price accelerates toward a level
- Large bid/ask imbalance at that level
- Reversal or absorption once reached

## 4g. INSTITUTIONAL LIQUIDITY RUNS

A cascade of liquidity being taken across multiple timeframes.

```
Phase 1: Internal EQH swept → minor reversal
Phase 2: Session high swept → continuation
Phase 3: Daily high swept → major reversal
```

Detection:
- Consecutive sweeps without significant retracement
- Each sweep targets the next higher timeframe level
- Final sweep = exhaustion + reversal

---

# 5. SOLID ANCHOR IDENTIFICATION — LIMIT ENTRY REFERENCE POINTS

## ROLE

Solid anchors are structural price levels where institutional orders are concentrated — the reference points for placing limit entries rather than chasing price.

## ANCHOR TYPES (RANKED BY RELIABILITY)

| Rank | Anchor Type | Definition | Limit Entry |
|------|-------------|------------|-------------|
| 1 | FRESH ORDER BLOCK | Untested OB from recent displacement | Limit buy at OB low (bullish), limit sell at OB high (bearish) |
| 2 | FVG MIDPOINT (CE) | Consequent Encroachment of an untested FVG | Limit at CE level (midpoint of FVG) |
| 3 | UNMITIGATED S/D ZONE BOUNDARY | Fresh supply/demand zone edge nearest to price | Limit at zone high (supply) or zone low (demand) |
| 4 | OTE 0.705 LEVEL | Fibonacci retracement from HTF swing | Limit at 0.618-0.786 zone, priority at 0.705 |
| 5 | LIQUIDITY SWEEP LEVEL | Price level where stops were taken and reversed | Limit at sweep + small buffer (limit fills on retest) |
| 6 | PREMIUM/DISCOUNT ARRAY EXTREME | 0.79 (extreme premium) or 0.21 (extreme discount) | Limit at array boundary for mean reversion |
| 7 | POC / VALUE AREA BOUNDARY | Volume profile high-volume node or VAH/VAL | Limit at POC (equilibrium reversion) or VAL/VAH |

## ANCHOR QUALITY SCORING (0-100)

Each anchor scored on:

| Criterion | Weight | Max Points |
|-----------|--------|-----------|
| Freshness (0 retests = max) | 0.25 | 25 |
| Multi-TF alignment (same level on 3+ TFs) | 0.20 | 20 |
| Volume at creation (>1.5x = max) | 0.15 | 15 |
| Proximity to current price (<2 avg_range = max) | 0.15 | 15 |
| Recent liquidity sweep nearby | 0.10 | 10 |
| No opposing anchor within 1 avg_range | 0.10 | 10 |
| Clean structure (clear swing point) | 0.05 | 5 |

| Score | Grade | Action |
|-------|-------|--------|
| 80+ | SOLID | Primary anchor — place limit entry |
| 60-79 | VALID | Secondary anchor — use if primary triggered |
| 40-59 | WEAK | Monitor — not for limit entry |
| <40 | NOISE | Ignore |

## ANCHOR HUNTING RULES

- The strongest entry is when MULTIPLE anchor types converge at the same price level (e.g., OB low = FVG CE = OTE 0.705)
- An anchor is "hunted" when price reaches within 0.1 avg_range of the level — this is the limit entry trigger zone
- If price blows through the anchor without reaction (>0.5 avg_range beyond) → anchor is invalidated
- Anchors decay with each retest: 1st retest = -20% quality, 2nd = -50%, 3rd = discard
- Always combine with pending liquidity — an anchor that also has untapped liquidity on the other side is the highest probability
- Anchors must align with the HTF direction (or be part of an inverse sweep setup) — never place a limit entry at an anchor that fights the established HTF structure

## ANCHOR → LIMIT ENTRY MAPPING

```
Bullish Limit Entry:
  Anchor: Fresh demand zone low, bullish OB low, or OTE 0.618-0.786 from HTF swing
  Limit: place at anchor level
  Trigger: price reaches anchor, rejection candle forms (pin, engulfing), volume confirms
  Stop: below anchor low by 0.3 avg_range buffer
  TP1: next structural resistance / EQH / opposite zone boundary

Bearish Limit Entry:
  Anchor: Fresh supply zone high, bearish OB high, or OTE 0.618-0.786 from HTF swing
  Limit: place at anchor level
  Trigger: price reaches anchor, rejection candle forms (pin, engulfing), volume confirms
  Stop: above anchor high by 0.3 avg_range buffer
  TP1: next structural support / EQL / opposite zone boundary
```

## ANCHOR INVALIDATION

An anchor is invalid if:
- Price closes more than 0.5 avg_range beyond the anchor level without reversal
- The structural level that created the anchor is broken (e.g., the swing high that defined the fib retracement is breached)
- Opposite liquidity sweep appears before price reaches the anchor
- Volume at anchor breach confirms the move (closing > 1.5x, close beyond)

---

# 6. DISPLACEMENT ENGINE

Valid if:
- ≥1.5x avg_range candle
- volume expansion
- directional close near extreme

## Impulse vs Retracement Legs:

| Leg Type | Volume | Range | Structure |
|----------|--------|-------|-----------|
| IMPULSE | Expanding (1.5x+) | Wide (1.5x avg_range+) | BOS direction |
| RETRACEMENT | Contracting (< 1x) | Narrow (< 1 avg_range) | Counter-trend |

- Impulse legs = directional conviction
- Retracement legs = profit-taking or position building
- 3+ consecutive impulse legs = strong trend
- Shallow retracement = aggression

---

# 6. ELLIOTT WAVE THEORY (STRUCTURE LENS)

Elliott Wave overlays on existing structure — only used when structure is clear, not forced.

## 6a. IMPULSE WAVES (1–2–3–4–5)

A 5-wave move in the direction of the trend.

| Wave | Character | Volume | Retracement |
|------|-----------|--------|-------------|
| Wave 1 | Initial move from low | Below avg | — |
| Wave 2 | Retrace of wave 1 | Declining | 0.5–0.786 of wave 1 |
| Wave 3 | Strongest, longest | Expanding, > 1.5x | — |
| Wave 4 | Retrace of wave 3 | Declining, orderly | Above wave 1 high (rule: no overlap) |
| Wave 5 | Final push | May diverge (weakening) | — |

### Wave Rules (HARD):
- Wave 2 cannot retrace beyond start of Wave 1
- Wave 3 is NEVER the shortest impulse wave
- Wave 4 cannot overlap Wave 1

### Wave Extension:
- One of waves 1, 3, or 5 is EXTENDED (1.618x+ the other two)
- Wave 3 is most commonly extended

### Wave Truncation:
- Wave 5 fails to exceed Wave 3 extreme
- Indicates trend exhaustion
- Often precedes sharp reversal

## 6b. CORRECTIVE WAVES (A–B–C)

A 3-wave move against the trend.

| Wave | Character |
|------|-----------|
| Wave A | First move against trend, often mistaken as pullback |
| Wave B | Retrace of A, lower volume, often fails |
| Wave C | Final leg of correction, often equals A in length |

### Corrective Patterns:

| Pattern | Shape | A vs C | B retrace |
|---------|-------|--------|-----------|
| Zigzag (5-3-5) | Sharp | C = A or 1.618x | 0.382–0.5 of A |
| Flat (3-3-5) | Sideways | C = A or 1.618x | 0.9–1.0 of A |
| Triangle (3-3-3-3-3) | Converging | — | — |

### Wave Alternation:
If Wave 2 is sharp, Wave 4 is likely flat (and vice versa).
- Sharp = deep, fast retracement
- Flat = shallow, time-consuming consolidation

## 6c. FIBONACCI RELATIONSHIPS (Elliott)

| Relationship | Ratio |
|-------------|-------|
| Wave 2 = 0.5–0.786 of Wave 1 | Retracement |
| Wave 3 = 1.618–2.618 of Wave 1 | Extension |
| Wave 4 = 0.382–0.5 of Wave 3 | Retracement |
| Wave 5 = 0.618–1.0 of (Wave 1 → Wave 3) | Projection |
| Wave C = 0.618–1.618 of Wave A | Correction |
| Wave B = 0.382–0.886 of Wave A | Retracement |

## 6d. FRACTAL WAVE STRUCTURE

Each impulse wave contains smaller 5-wave impulses within it.

```
Weekly: 5-wave impulse
  ↓
Daily: each week-wave contains 5 daily waves
  ↓
4H: each day-wave contains 5 4H waves
```

- Always check one TF higher for wave context
- Always check one TF lower for entry timing

## 6e. ELLIOTT WAVE APPLICATION RULES

- NEVER force a wave count — if it's not clear, there is no wave
- ONLY apply when structure is clean (clear HH/HL swings)
- Use to identify where in the trend cycle price is
- Wave 3 = highest conviction, Wave 5 = caution
- Corrective waves = opportunity for counter-trend entries
- Wave truncation = high probability reversal

---

# 7. MULTI-TF STRUCTURE RULE

Hierarchy:

W > D > 4H > 1H > 15m > 5m

HTF sets direction context. LTF confirms displacement after sweep.

During HTF liquidity sweeps, LTF breaks against HTF trend to reach the liquidity level — this is expected, not invalid.

---

# 8. Mxwll + OHLCV INTEGRATION

Mxwll and OHLCV are used together. Neither is subordinate.

## Combined Decision

| Mxwll Signal | OHLCV Agreement | Result |
|-------------|-----------------|--------|
| Clear BoS/CHoCH | Same direction displacement | HIGH CONFIDENCE structure signal |
| Clear label | Price at swing point | VALID swing — use Mxwll price level |
| No label | Clear HH/HL from price | SWING from OHLCV — Mxwll may not cover this TF |
| I-BoS / I-CHoCH label | Price shows partial structure | WEAK signal — treat as potential, not confirmation |
| Mxwll HH/HL | OHLCV shows same | CONFIRMED swing structure |
| Mxwll fib levels | Price reacting at level | FIB zone active — confluence with structure |
| 240H/240L labels | 4H swing points | HTF level — use for liquidity mapping |
| 1DH/1DL labels | Daily swing points | HTF level — HIGH relevance for liquidity

---

# 9. STRUCTURE CONFIDENCE

```
confidence =
  (trend * 0.10) +
  (liquidity * 0.25) +
  (displacement * 0.20) +
  (BOS_quality * 0.15) +
  (TF_alignment * 0.10) +
  (elliott_wave_clarity * 0.10) +
  (supply_demand_alignment * 0.10)
```

Weights ensure liquidity + displacement dominate. During inverse sweeps, strong liquidity and displacement scores offset low TF alignment — the setup remains valid as long as liquidity > 60 and displacement > 60.

Minimum confidence for valid structure: 60

---

# 10. OUTPUT

```json
{
  "trend": "",
  "trend_phase": "CONTINUATION | EXHAUSTION | REVERSAL | RANGE",

  "structure": {
    "bos": {},
    "choch": {},
    "mss": false
  },

  "elliott_wave": {
    "count_valid": true,
    "current_wave": "",
    "impulse_complete": false,
    "corrective_pattern": "",
    "wave_extended": false,
    "truncation_detected": false,
    "fractal_alignment": "ALIGNED | PARTIAL | CONFLICT"
  },

  "liquidity": {
    "sweeps": [],
    "external": [],
    "internal": [],
    "voids": [],
    "runs": [],
    "pending": []
  },

  "anchors": [
    {
      "price": 0,
      "type": "ORDER_BLOCK | FVG_CE | SD_ZONE | OTE | SWEEP | PD_ARRAY | POC",
      "direction": "LONG | SHORT",
      "quality": 0,
      "grade": "SOLID | VALID | WEAK | NOISE",
      "retest_count": 0,
      "multi_tf_count": 0,
      "convergence_types": []
    }
  ],

  "best_anchor": {
    "price": 0,
    "type": "",
    "quality": 0,
    "entry_model": "LIMIT_BUY | LIMIT_SELL | NONE"
  },

  "displacement": {
    "valid": true,
    "leg_type": "IMPULSE | RETRACEMENT"
  },

  "multi_tf": {
    "alignment": "FULL | PARTIAL | CONFLICT"
  },

  "confidence": 0,

  "status": "VALID | INVALID | WEAK"
}
```

---

# FINAL RULE

> If structure is not confirmed → NO EDGE EXISTS