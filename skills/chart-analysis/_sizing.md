---
name: _sizing
description: Position sizing, Kelly fraction, ATR-based and structure-based sizing, R:R validation
---

# Sizing — Risk-First Position Sizing

## Dependencies
- `_confluence` → provides conviction, scoring table, entry_zone, asymmetry_ratio, atr_pct, direction
- `_structure` → provides order_blocks, fvg (for structural stop placement)

## Inputs
```
{
  "conviction": "SNIPER" | "NORMAL" | "HALF" | "SCALP_TRADE" | "SCALP_REDUCED",
  "style": "scalp" | "swing",
  "account_balance": 10000,  // user-provided
  "atr_pct": 0.15,           // from confluence (via setup study_values)
  "entry_zone": { "price": 1.0450, "zone_type": "OB+FIB+SWEEP" },
  "order_blocks": [{ type, status, strength, high, low }],  // from structure, for stop placement
  "fvg": [{ type, status, strength, high, low }],
  "direction": "LONG" | "SHORT"
}
```

## Steps

### 1. Kelly Optimal Fraction

```python
kelly_pct = win_rate - ((1 - win_rate) * avg_loss / avg_win)
# Cap at 25% of account. Default to 0.5x Kelly (Half-Kelly).
```

### 2. ATR-Based Position Size (Scalp)

```python
atr_14 = get_atr_14()
account_risk = account_balance * 0.005  # 0.5% max
stop_distance = atr_14 * 0.3
position_size = account_risk / stop_distance
```

| Conviction | Risk per Trade | Size Multiplier |
|-----------|---------------|------------------|
| SCALP_TRADE | 0.5% | 1.0x base |
| SCALP_REDUCED | 0.25% | 0.5x base |
| Low vol (< 0.08% ATR) | 0 | NO TRADE |
| Outside liquid session | 0 | NO TRADE |

### 3. Structure-Based Position Size (Swing)

```python
account_risk = account_balance * 0.01  # 1% max
stop_distance = abs(entry - structural_stop)
position_size = account_risk / stop_distance
```

| Conviction | Risk per Trade | Notes |
|-----------|---------------|-------|
| SNIPER (14-15/15) | 1.0% | OB + Fib + EW aligned. Full size. |
| NORMAL (12-13/15) | 0.75% | 0.75x base |
| HALF (10-11/15) | 0.5% | Wait for extra confirmation |
| Wave 5 overlay | Cap at 0.75% | Exhaustion risk |
| < 10/15 | 0% | NO TRADE |

### 4. Leverage Calibration

| Asset Volatility | Max Leverage | Stop Multiple |
|-----------------|--------------|---------------|
| Low (ATR < 1%) | 5x | 2x ATR |
| Medium (ATR 1-3%) | 3x | 2x ATR |
| High (ATR 3-5%) | 2x | 1.5x ATR |
| Extreme (ATR > 5%) | 1x or pass | 1x ATR |

**Hard rule:** Never exceed 3x leverage unless multi-leg hedge.

### 5. Stop Placement Rules

| Entry Type | Direction | Stop Level | Source |
|-----------|-----------|-----------|--------|
| Sweep long | Long | Below sweep wick low minus ATR/4 | `_volume` stop_hunts |
| Sweep short | Short | Above sweep wick high plus ATR/4 | `_volume` stop_hunts |
| OB long | Long | Below OB low | `_structure` order_blocks |
| OB short | Short | Above OB high | `_structure` order_blocks |
| FVG long | Long | Below FVG low | `_structure` fvg |
| FVG short | Short | Above FVG high | `_structure` fvg |

**Max loss check:** Confirm $ value loss before entry. If it exceeds account risk, reduce size. Never widen stop to fit position size.

### 6. Position Size Rounding

Always round down. 247 shares → 200 shares.

## Output

```
{
  "direction": "LONG" | "SHORT",  // from confluence
  "account_risk_pct": 0.5,      // % of account at risk
  "account_risk_usd": 50,
  "kelly_fraction": 0.15,
  "position_size": 200,          // units/shares
  "leverage": 2,
  "stop_distance_units": 0.0025,  // price distance
  "stop_price": 1.0425,
  "stop_type": "sweep_wick",
  "entry_price": 1.0450,
  "rr": 2.3,
  "confidence_level": "high"
}
```

## Next Module
Pass output → `_execution`
