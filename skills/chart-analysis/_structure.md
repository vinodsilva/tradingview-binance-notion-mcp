---
name: _structure
description: Liquidity maps, sweep detection, SMC zones (OB/Breaker/FVG/CISD), Wyckoff phases, Elliott Wave (validation), Fibonacci clustering, inducement, structural inefficiency
---

# Structure — Institutional Liquidity & Market Geometry Engine (v3.0)

## Core Philosophy

Price is not random. It is engineered through:

- Liquidity attraction → execution → displacement → re-liquidity
- Structural inefficiencies (FVG / gaps)
- Stop-loss engineering (inducement + sweeps)
- Fractal expansion cycles

This module defines **where** price is likely engineered to move, not trade execution.

## Dependencies
- `_setup` → OHLCV multi-timeframe data
- `_volume` → confirmation layer (DO NOT duplicate logic)

## Inputs
```
{
  "tf_data": { W, D, 4H, 60, 15: { ohlcv, study_values } },
  "current_price": float,
  "direction": "LONG" | "SHORT" | null,
  "style": "scalp" | "swing",
  "volume": {                        // optional — from _volume for confirmation
    "dominant_signature": "IMPULSE" | "ABSORPTION" | "COMPRESSION" | null,
    "bars_classified": [{ index, type, description }],
    "stop_hunts": [{ level, direction, volume_ratio }]
  }
}
```

Volume confirmation is used inline:
- Sweep engine: `volume_ratio > 1.5` from volume.stop_hunts
- BOS/CHoCH: dominant_signature == "IMPULSE" confirms structural break
- Wyckoff C (spring/upthrust): stop_hunt + absorption signature

## Steps

### 1. Liquidity Engine (Primary Driver)

#### Swing Detection
```python
swing_high = high[i] > max(high[i-5:i]) and high[i] > max(high[i+1:i+6])
swing_low  = low[i] < min(low[i-5:i]) and low[i] < min(low[i+1:i+6])
```

#### Liquidity Types
- Equal Highs / Lows
- Swing highs/lows
- Session highs/lows (Asia, London, NY)
- Weekly / Monthly extremes
- OB invalidation zones
- FVG edges (hidden liquidity)
- VWAP deviation zones

#### Liquidity Scoring
```
Score = TF Weight + Touch Count × 2 + Rejection Strength × 3 + Cluster Density + Recency Boost
```

| TF | Weight |
|----|--------|
| Weekly | 12 |
| Daily | 9 |
| 4H | 6 |
| 1H | 3 |
| 15m | 1 |

| Grade | Meaning |
|-------|---------|
| **S** | Institutional magnet |
| **A** | Major reversal zone |
| **B** | Tradeable level |
| **C** | Weak level |
| **D** | Noise |

#### Liquidity Clusters

Cluster if:
- Scalp: ≤ 0.2%
- Swing: ≤ 0.5%

Clusters represent:
- Stop pools
- Equal highs/lows
- Range boundaries

### 2. Sweep Engine

#### Sweep Conditions (STRICT)

**Buy-side sweep (bearish trigger)**
- `high > level` AND `close < level` AND `wick_ratio > 0.45`

**Sell-side sweep (bullish trigger)**
- `low < level` AND `close > level` AND `wick_ratio > 0.45`

#### Sweep States
1. **Engine** → drift into liquidity
2. **Sweep** → liquidity grab
3. **Acceptance** → hold beyond level
4. **Rejection** → return through level

#### Sweep Quality Score
- Volume strength (from `_volume`)
- Wick depth
- Close reclaim speed
- Level grade

### 3. Structure Engine (SMC Core)

#### BOS (Break of Structure)
- Bullish BOS = close above swing high
- Bearish BOS = close below swing low

**Rules:**
- Must be candle **CLOSE** (not wick)
- Must align with liquidity logic

#### CHoCH (Change of Character)
Structural reversal signal.

**VALID ONLY IF:**
- Liquidity sweep OR displacement exists
- Volume expansion confirms (`_volume`)

#### Structure States
| State | Description |
|-------|-------------|
| **Uptrend** | HH / HL |
| **Downtrend** | LH / LL |
| **Transition** | CHoCH active |
| **Range** | No edge |

### 4. Inducement Engine (CRITICAL)

#### Definition

False structure designed to attract liquidity before reversal.

#### Types
- False BOS
- Weak breakout
- Premature CHoCH
- Engineered continuation trap

#### Rule

If structure breaks WITHOUT liquidity sweep → inducement likely.

### 5. Order Block Engine

#### Definition
- Bullish OB = last bearish candle before impulse up
- Bearish OB = last bullish candle before impulse down

#### OB States
| State | Meaning |
|-------|---------|
| **Fresh** | High probability |
| **Mitigated** | Touched |
| **Broken** | Invalidated |
| **Reclaimed** | Flipped polarity |

#### OB Score Factors
- Impulse strength
- Liquidity context
- Volume confirmation
- Time freshness

### 6. FVG / Inefficiency Engine

#### Definition

3-candle imbalance gap.

#### Types
| Type | Description |
|------|-------------|
| Bullish FVG | Gap up (C1 high < C3 low) |
| Bearish FVG | Gap down (C1 low > C3 high) |
| IFVG | Inverted FVG |

#### FVG States
| State | Meaning |
|-------|---------|
| **Unfilled** | Continuation magnet |
| **Partial** | Still active |
| **Filled** | Inactive |
| **Inverted** | Reversal zone |

### 7. Liquidity Vacuum Engine

#### Definition

Area with no structural resistance.

#### Rule
- `distance between swings > 3 × ATR`

#### Meaning
- Fast expansion zone
- Low friction movement
- High volatility continuation path

### 8. Wyckoff Structure Engine

#### Phases
| Phase | Event |
|-------|-------|
| **A** | Exhaustion |
| **B** | Accumulation / Distribution |
| **C** | Manipulation (spring / upthrust) |
| **D** | Trend expansion |
| **E** | Distribution completion |

#### Rule

Wyckoff is **VALID** only if:
- Confirmed by liquidity sweep
- Confirmed by structure (BOS / CHoCH)

### 9. Elliott Wave Filter (Validation Only)

#### Role

Used **ONLY** for structure validation.

#### Rules
- Wave 3 must align with BOS + expansion
- Wave 4 must respect FVG zone
- Wave 5 = liquidity trap zone

**Invalid if:**
- No BOS confirmation
- No displacement
- No liquidity context

### 10. Fibonacci Cluster Engine

#### Role

Liquidity magnet + confluence tool **ONLY**.

#### Clustering
- Scalp: ≤ 0.25%
- Swing: ≤ 0.5%

#### Zones
| Zone | Meaning |
|------|---------|
| 0.382–0.618 | Retracement liquidity |
| 0.705–0.79 | Trap zone |
| 1.272–1.618 | Expansion target |
| 2.0+ | Breakout extension |

#### Fib Grade
| Grade | Meaning |
|-------|---------|
| **S** | Multi-TF cluster + liquidity zone |
| **A** | Strong confluence |
| **B** | Usable |
| **C** | Weak |

### 11. Structure Confidence Engine

```
Structure Score = Liquidity Strength (30%) + BOS/CHoCH Quality (20%)
                + OB/FVG Alignment (20%) + Fractal Alignment (15%)
                + Fib Confluence (15%)
```

## Output

```
{
  "liquidity": {
    "grade": "A",
    "dominant_side": "buy_side_liquidity_above"
  },

  "structure": {
    "trend": "UP",
    "bos": "BULLISH",
    "choch": null,
    "state": "ACCUMULATION"
  },

  "atr_pct": 0.15,                            // from entry TF study_values

  "order_blocks": [
    {
      "type": "BULLISH_OB",
      "status": "FRESH",
      "strength": 91,
      "high": 1.0460,                          // for stop / entry placement
      "low": 1.0440
    }
  ],

  "fvg": [
    {
      "type": "BULLISH_FVG",
      "status": "UNFILLED",
      "strength": 88,
      "high": 1.0455,                          // for stop / entry placement
      "low": 1.0445
    }
  ],

  "inducement": {
    "detected": false
  },

  "wyckoff": {
    "phase": "C",
    "event": "SPRING"
  },

  "elliott": {
    "valid": true,
    "context": "WAVE_3_EXPANSION"
  },

  "fib_clusters": [
    {
      "grade": "A",
      "strength": 86
    }
  ],

  "vacuum_zone": false,

  "structure_score": 92
}
```

## Next Module
Pass output → `_confluence`
