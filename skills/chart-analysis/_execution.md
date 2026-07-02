---
name: _execution
description: Entry triggers, trade management, pyramiding, partial exits, trailing stops, time stops, invalidation monitoring
---

# Execution — Entry & Trade Management

## Dependencies
- `_sizing` → provides entry_price, stop_price, stop_type, position_size, direction, atr_pct
- `_structure` → provides structure.trend (invalidation context), order_blocks, fvg, vacuum_zone

## Inputs
```
{
  "direction": "LONG" | "SHORT",        // from _sizing
  "entry_price": float,
  "stop_price": float,
  "stop_type": "sweep_wick" | "ob" | "fvg" | "absorption",
  "position_size": int,
  "leverage": int,
  "structure_trend": "UP" | "DOWN" | "RANGE",  // from _structure — for invalidation context
  "vacuum_zone": bool,                     // from _structure
  "order_blocks": [{ type, status, strength }],  // from _structure, for structural stops
  "fvg": [{ type, status, strength }],
  "style": "scalp" | "swing",
  "atr_pct": float,                        // from _structure (structure.atr_pct)
  "account_risk_usd": float
}
```

## Steps

### 1. Entry Trigger — Mechanical Execution

#### Long Entry Checklist
- [ ] HTF trend bullish OR asymmetry 3:1+ for reversal
- [ ] Price just swept sell-side liquidity AND reversed
- [ ] At least one bullish volume bar (close > open, 1.5x avg vol)
- [ ] Price at or above VWAP on entry TF
- [ ] RSI on 15M not above 80
- [ ] Exact invalidation level known

#### Short Entry Checklist
- [ ] HTF trend bearish OR asymmetry 3:1+ for reversal
- [ ] Price just swept buy-side liquidity AND rejected
- [ ] At least one bearish volume bar (close < open, 1.5x avg vol)
- [ ] Price at or below VWAP on entry TF
- [ ] RSI on 15M not below 20
- [ ] Exact invalidation level known

**Turtle rule:** All conditions met → enter without hesitation. Any missing → pass.

**Entry execution:** Enter at market or limit at retest. Never chase > 0.5x ATR from trigger.

### 2. Pyramiding (Livermore / Druckenmiller)

| Condition | Action |
|-----------|--------|
| +1R in favor | Scale in 50% additional size |
| +2R in favor | Scale in 25% additional size |
| +3R in favor | No more adds. Let runner breathe. |

**Never add if price hasn't moved in your favor.** Each add uses tighter stop.

### 3. Partial Profit Taking

| Level | Action |
|-------|--------|
| +1R | Sell 25% → move stop to breakeven |
| +2R | Sell 25% → trail stop by 1 ATR |
| +3R | Sell 25% → trail stop by 1.5 ATR |
| Runner | Hold last 25% with trailing stop |

### 4. Trailing Stop

1. Trail at previous swing low/high (structure-based)
2. Never loosen — only tighten
3. Gaps through stop → accept and move on

### 5. Time Stop (Seykota)

If price hasn't moved 0.5x ATR in your favor within 5 bars on entry TF → exit.

### 6. Structure Invalidation Monitoring

Check every bar against `_structure` state:

```python
def check_invalidations(direction, structure_trend, vacuum_zone, structure_score):
    trend_flip = (direction == "LONG" and structure_trend == "DOWN") or \
                 (direction == "SHORT" and structure_trend == "UP")
    vacuum_breach = vacuum_zone and structure_score < 50
    structure_weak = structure_score < 30
    if trend_flip or (vacuum_breach and structure_weak):
        return "EXIT"
    return "HOLD"
```

| Condition | Action |
|-----------|--------|
| **Trend flip** (UP→DOWN for long, DOWN→UP for short) | Exit IMMEDIATELY. No re-entry. |
| **Vacuum breach + score < 50** | Exit. Wait for structure re-establishment. |
| **Structure score < 30** | Exit. No same-day re-entry. |
| **Structure score 30-50** | Tighten stop to breakeven. |

### 7. Exit Matrix

| Scenario | Scalp Action | Swing Action |
|----------|-------------|-------------|
| Price hits T1 | Take 50%. Trail rest to breakeven. | Take 30%. Trail to 50% of stop. |
| Price hits T2 | Take remaining. Done. | Take 40%. Trail to entry. |
| Price hits T3 | N/A | Run 30% on EMA50 trail. |
| Price hits stop | Journal the loss. | Journal the loss. |
| TF invalidation | Exit immediately | Exit immediately |
| Price stalls before T1 | Time stop (30 min) | Hold. |
| CHOCH against entry | N/A (scalp) | Exit all immediately. |
| Major news drops | Exit immediately. | Tighten to breakeven. |

### 8. Risk Rules

- Max risk per trade: 0.5% (scalp), 1% (swing)
- Max portfolio exposure: 3%
- Max open positions: 2 scalp / 4 swing
- Structural stop-loss only (not dollar-based)
- No adding to losing positions
- TF invalidation overrides all other exit rules

### 9. Chart Annotations

Use `draw_shape` to mark:
- Entry level + label ("Entry")
- Stop level + red line ("SL")
- TP1 + green dashed line ("+1R")
- TP2 + green dashed line ("+2R")
- Structural: BOS, Sweep, Divergence, S/D zones, OBs, FVGs, Fib levels

**Color scheme:** Green = profit zone, Red = loss zone.

```python
# Long template
draw_shape(shape="text", point={time: ts, price: entry}, text="LONG")
draw_shape(shape="horizontal_line", point={time: ts, price: entry}, overrides='{"linecolor":"#00ff00","linewidth":2}')
draw_shape(shape="horizontal_line", point={time: ts, price: stop}, overrides='{"linecolor":"#ff0000","linewidth":2}')
draw_shape(shape="horizontal_line", point={time: ts, price: tp1}, overrides='{"linecolor":"#00ff00","linewidth":1,"linestyle":2}')
draw_shape(shape="horizontal_line", point={time: ts, price: tp2}, overrides='{"linecolor":"#00ff00","linewidth":1,"linestyle":2}')

# Short template — red entry, stop ABOVE entry, green profit BELOW
draw_shape(shape="text", point={time: ts, price: entry}, text="SHORT")
draw_shape(shape="horizontal_line", point={time: ts, price: entry}, overrides='{"linecolor":"#ff0000","linewidth":2}')
draw_shape(shape="horizontal_line", point={time: ts, price: stop}, overrides='{"linecolor":"#ff0000","linewidth":2}')
draw_shape(shape="horizontal_line", point={time: ts, price: tp1}, overrides='{"linecolor":"#00ff00","linewidth":1,"linestyle":2}')
draw_shape(shape="horizontal_line", point={time: ts, price: tp2}, overrides='{"linecolor":"#00ff00","linewidth":1,"linestyle":2}')
```

## Output

```
{
  "checklist_passed": true | false,
  "entry_executed": true | false,
  "entry_price_executed": 1.0450 | null,
  "tp1": 1.0525,
  "tp2": 1.0600,
  "pyramiding": { "level1": 1.0525, "level2": 1.0600 },
  "annotations_drawn": ["entry", "stop", "tp1", "tp2"],
  "screenshot_path": "screenshots/2025-01-15_trade_plan.png"
}
```

## Next Module
Pass output → `_report`
