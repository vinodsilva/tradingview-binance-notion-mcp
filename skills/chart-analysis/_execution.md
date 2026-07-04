---
name: _execution
description: Entry triggers, trade management, pyramiding, exits, chart annotations
---

# Execution — Entry & Trade Management

## Dependencies
- `_sizing` → entry, stop, position size, direction
- `_structure` → trend (invalidation), OBs, FVGs
- `_confluence` → StEngine cross-validation flag

## StEngine Strategy Alignment

The StEngine Pine Script has its own built-in trade management. When the strategy fires a signal:

| Parameter | Strategy Default | MCP Override |
|-----------|-----------------|--------------|
| Stop Loss | 2x ATR from entry | Can override via `indicator_set_inputs(useSL=false)` if structural stop differs |
| Take Profit | 3x ATR from entry | Can override if structural TP further |
| Trailing Stop | 2x ATR trail (optional) | MCP trail is 1 ATR — more aggressive |
| Partial TP | 50% at 2x ATR (optional) | MCP is 25% at 1R, 25% at 2R — phased |
| Flip on opposite | YES (strategy built-in) | Same |
| CHoCH exit | YES (strategy built-in) | Same |

**If both agree** — execute via MCP for manual flexibility, or let the strategy auto-execute
**If MCP overrides strategy** — disable strategy's built-in SL/TP via inputs and use MCP-managed stops

## Steps

### 1. Entry Checklist (All Must Pass)

**EV pre-check:** EV_ratio must be > 0.3. If EV_ratio <= 0.3 → NO ENTRY regardless of other conditions.

**Long:** HTF trend bullish OR asymmetry 3:1+, price swept sell-side liquidity and reversed, bullish vol bar (close > open, >1.5x vol), price at/above VWAP, RSI not above 80, invalidation level known, effective_score >= 70.

**Short:** HTF trend bearish OR asymmetry 3:1+, price swept buy-side liquidity and rejected, bearish vol bar (close < open, >1.5x vol), price at/below VWAP, RSI not below 20, invalidation level known, effective_score >= 70.

**Turtle rule:** All conditions met → enter. Any missing → pass. Enter at market or limit on retest. Never chase > 0.5x ATR from trigger.

### 2. Pyramiding (Livermore)
| Price moved | Add |
|-------------|-----|
| +1R in favor | +50% size |
| +2R in favor | +25% size |
| +3R+ | No more adds |

Never add if price hasn't moved in your favor. Tighter stop on each add.

### 3. Partial Exits

| Level | Action |
|-------|--------|
| +1R | Sell 25% → move stop to breakeven |
| +2R | Sell 25% → trail stop by 1 ATR |
| +3R | Sell 25% → trail stop by 1.5 ATR |
| Runner | Hold 25% with trailing stop |

### 4. Trailing Stop
Trail at previous swing low/high (structure-based). Never loosen — only tighten.

### 5. Time Stop (Seykota)
If price hasn't moved 0.5x ATR in your favor within 5 bars on entry TF → exit.

### 6. Invalidation Monitoring
Check every bar:
- Trend flips (UP→DOWN for long, DOWN→UP for short) → EXIT immediately
- Structure score collapses (sustained break of key OB/FVG) → EXIT

### 7. Exit Matrix

| Scenario | Action |
|----------|--------|
| Price hits TP1 | Take partial, trail rest |
| Price hits TP2 | Take remaining, done |
| Price hits stop | Journal the loss |
| Trend flip | Exit immediately |
| Price stalls before TP1 | Time stop |
| CHOCH against entry | Exit all |
| Major news | Exit or tighten to breakeven |

### 8. Draw Trade on Chart
Use `draw_shape` for visual plan:
- Entry: text label + horizontal line (green for long, red for short)
- Stop: horizontal line (red, "SL")
- TP1/TP2: dashed horizontal lines (green, "+1R"/"+2R")
- Sweep levels: yellow dashed lines ("SWEEP")
- OB zones: cyan dotted rectangles
- FVG zones: magenta dotted rectangles

Use `draw_forecast(direction, entry, targets, stop_loss, bars_forward)` for projection line.

## Output

```
{
  checklist_passed: true | false,
  entry_executed: true | false,
  entry_price_executed: float | null,
  tp1, tp2,
  annotations_drawn: ["entry", "stop", "tp1", "tp2", ...],
  screenshot_path: "screenshots/..."
}
```

## Next
Pass to `_report`
