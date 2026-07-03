---
name: _sizing
description: Position sizing, risk per conviction, stop placement
---

# Sizing — Risk-First Position Sizing

## Dependencies
- `_confluence` → conviction, entry zone, ATR%, direction
- `_structure` → order blocks, FVGs for stop placement

## Steps

### 1. Set Risk Per Trade by Conviction

| Conviction | Risk | When |
|------------|------|------|
| SNIPER | 1.0% | All must-pass + 9-11/11 checklist |
| NORMAL | 0.75% | All must-pass + 7-8/11 |
| HALF | 0.5% | Must-pass pass but weak supporting |
| SCALP_TRADE | 0.5% | Scalp checklist >= 9/11 |
| SCALP_REDUCED | 0.25% | Scalp checklist 7-8/11 |

**No-trade conditions:** ATR < 0.08%, outside liquid session, must-pass failure.

### 2. Place Structural Stop
Stop is based on structure, not dollar amount:

| Entry Type | Direction | Stop | Source |
|-----------|-----------|------|--------|
| Sweep long | Long | Below sweep wick low | `_volume` |
| Sweep short | Short | Above sweep wick high | `_volume` |
| OB long | Long | Below OB low | `_structure` |
| OB short | Short | Above OB high | `_structure` |
| FVG long | Long | Below FVG low | `_structure` |
| FVG short | Short | Above FVG high | `_structure` |

**Hard rules:** Never widen stop to fit size. Always round position down.

### 3. Validate R:R
- Scalp minimum: 1.5:1
- Swing minimum: 2:1
- If R:R below minimum, reduce size or pass

### 4. Leverage (Optional)
- ATR < 1% → max 5x
- ATR 1-3% → max 3x
- ATR 3-5% → max 2x
- ATR > 5% → 1x or pass
- Hard cap: never exceed 3x without multi-leg hedge

## Output

```
{
  direction, conviction,
  account_risk_pct,
  stop_price, stop_type,
  entry_price, rr,
  leverage
}
```

## Next
Pass to `_execution`
