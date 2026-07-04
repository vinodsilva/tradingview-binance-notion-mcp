---
name: _sizing
description: Position sizing, risk per conviction, stop placement
---

# Sizing — EV-First Position Sizing

## Dependencies
- `_confluence` → effective_score, EV_ratio, confluence_score, entry zone, direction
- `_structure` → order blocks, FVGs for stop placement

## Steps

### 1. Compute Position EV

From `_confluence`:
```
effective_score = effective_score   # EV-adjusted probability (0-100)
EV_ratio        = ev_ratio          # EV as multiple of risk
avg_win_R       = avg_win_R         # weighted average target
```

### 2. Set Risk Per Trade by EV-Adjusted Conviction

| Conviction | Risk | EV Ratio | effective_score |
|------------|------|----------|-----------------|
| SNIPER | 1.0% | > 3.0 AND >= 90 | >= 90 |
| NORMAL | 0.75% | > 2.0 OR >= 85 | 80-89 |
| HALF | 0.50% | > 1.0 OR >= 75 | 70-79 |
| THIN | 0.25% | 0.3 - 1.0 | >= 70 (reduced) |

**EV floor:** EV_ratio <= 0.3 → NO TRADE regardless of confluence score.
**Score floor:** effective_score < 70 AND no StEngine override → NO TRADE.

**EV override:** If EV_ratio > 2.0 BUT effective_score < 70 → SCALP sizing only (0.25%), flagged as "positive EV despite low score — volatile setup."

**Scalp sizing** (ATR < 0.5% or short session remaining):
| EV Ratio | Risk |
|----------|------|
| > 2.0 | 0.50% |
| 1.0 - 2.0 | 0.25% |
| < 1.0 | NO TRADE |

### 3. Place Structural Stop
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

### 4. Compute R:R from Targets (for EV formula input)

```
tp1_R = (tp1_price - entry_price) / (entry_price - stop_price)   (long)
tp2_R = (tp2_price - entry_price) / (entry_price - stop_price)
tp3_R = (tp3_price - entry_price) / (entry_price - stop_price)

avg_win_R = (0.25 * tp1_R) + (0.25 * tp2_R) + (0.50 * tp3_R)
```

Pass avg_win_R back to `_confluence` for EV recalibration if needed.

### 5. Leverage (Optional)
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
  avg_win_R, ev_ratio, effective_score,
  leverage
}
```

## Next
Pass to `_execution`
