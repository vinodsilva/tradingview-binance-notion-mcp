---
name: _sizing
description: Position sizing, risk per conviction, stop placement
---

# Sizing — Anchor-Relative EV-First Position Sizing

## Dependencies
- `_confluence` → effective_score, EV_ratio, confluence_score, entry zone, direction, anchor (grade, quality)
- `_structure` → best_anchor (price, type, quality), order blocks, FVGs for stop placement

## Core Principle

> Stop is placed relative to the ANCHOR, not relative to entry price. The anchor defines the risk.

Entry price = anchor price (limit order at anchor level). Stop = beyond anchor by structural buffer.

---

## Steps

### 1. Compute Position EV

From `_confluence`:
```
effective_score = effective_score   # EV-adjusted probability (0-100)
EV_ratio        = ev_ratio          # EV as multiple of risk
avg_win_R       = avg_win_R         # weighted average target
```

### 2. Set Risk Per Trade by EV-Adjusted Conviction + Anchor Quality

| Conviction | Risk | Anchor Grade | EV Ratio | effective_score |
|------------|------|--------------|----------|-----------------|
| SNIPER | 1.0% | SOLID (80+) | > 3.0 AND >= 90 | >= 90 |
| NORMAL | 0.75% | SOLID/VALID | > 2.0 OR >= 85 | 80-89 |
| HALF | 0.50% | VALID | > 1.0 OR >= 75 | 70-79 |
| THIN | 0.25% | VALID/WEAK | 0.3 - 1.0 | >= 70 (reduced) |

**Anchor quality override:** If `_structure.best_anchor.grade` is WEAK (<60), cap risk at HALF (0.50%) regardless of other factors. If NO anchor identified, cap at THIN (0.25%).

**EV floor:** EV_ratio <= 0.3 → THIN sizing (0.25%) with marginal EV flag.
**Score floor:** effective_score < 70 AND no anchor override → THIN sizing with REDUCED confidence flag.

**EV override:** If EV_ratio > 2.0 BUT effective_score < 70 → SCALP sizing only (0.25%), flagged as "positive EV despite low score — volatile setup."

**Scalp sizing** (range < 0.5% or short session remaining):
| EV Ratio | Risk |
|----------|------|
| > 2.0 | 0.50% |
| 1.0 - 2.0 | 0.25% |
| < 1.0 | MICRO (0.1%) |

### 3. Place Structural Stop — Anchor-Relative

Stop is placed relative to the **anchor level**, not entry price. For limit entries, entry = anchor, so stop is beyond the anchor boundary.

| Entry Model | Direction | Stop | Buffer | Source |
|-----------|-----------|------|--------|--------|
| LIMIT at OB | Long | Below OB low | 0.3 avg_range | `_structure.anchors` |
| LIMIT at OB | Short | Above OB high | 0.3 avg_range | `_structure.anchors` |
| LIMIT at FVG CE | Long | Below FVG low | 0.3 avg_range | `_structure.anchors` |
| LIMIT at FVG CE | Short | Above FVG high | 0.3 avg_range | `_structure.anchors` |
| LIMIT at S/D zone | Long | Below zone low | 0.3 avg_range | `_structure.anchors` |
| LIMIT at S/D zone | Short | Above zone high | 0.3 avg_range | `_structure.anchors` |
| LIMIT at OTE | Long | Below OTE low (0.618) | 0.3 avg_range | `_structure.anchors` |
| LIMIT at OTE | Short | Above OTE high (0.786) | 0.3 avg_range | `_structure.anchors` |
| LIMIT at sweep retest | Long | Below sweep wick low | 0.3 avg_range | `_volume` |
| LIMIT at sweep retest | Short | Above sweep wick high | 0.3 avg_range | `_volume` |

**Anchor stop buffer rules:**
- SOLID anchor: 0.3 avg_range buffer beyond anchor boundary
- VALID anchor: 0.4 avg_range buffer beyond anchor boundary (wider — less precise level)
- WEAK anchor: 0.5 avg_range buffer (widest — lowest confidence level)

**Hard rules:**
- Never widen stop to fit size. Always round position down.
- Stop must be BEYOND any visible sweep wick at the anchor level
- If sweep wick extends past the anchor, stop goes beyond the wick, not the anchor
- Never place stop inside the anchor zone — the anchor is the entry, stop is structural invalidation

### 4. Compute R:R from Targets (for EV formula input)

```
tp1_R = (tp1_price - entry_price) / (entry_price - stop_price)   (long)
tp2_R = (tp2_price - entry_price) / (entry_price - stop_price)
tp3_R = (tp3_price - entry_price) / (entry_price - stop_price)

avg_win_R = (0.25 * tp1_R) + (0.25 * tp2_R) + (0.50 * tp3_R)
```

Pass avg_win_R back to `_confluence` for EV recalibration if needed.

### 5. Leverage (Optional)
- Range < 1% → max 5x
- Range 1-3% → max 3x
- Range 3-5% → max 2x
- Range > 5% → 1x or pass
- Hard cap: never exceed 3x without multi-leg hedge

## Output

```
{
  direction, conviction,
  anchor_price, anchor_type, anchor_grade,
  account_risk_pct,
  stop_price, stop_type: "BEYOND_ANCHOR",
  stop_buffer: float (avg_range multiple),
  entry_price (same as anchor_price),
  rr, avg_win_R, ev_ratio, effective_score,
  leverage
}
```

## Next
Pass to `_execution`
