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

**Long:** HTF trend bullish OR inverse sweep with HTF liquidity confirmed OR asymmetry 3:1+, price swept sell-side liquidity and reversed, bullish vol bar (close > open, >1.5x vol), price at/above VWAP, RSI not above 80, invalidation level known, effective_score >= 70.

**Short:** HTF trend bearish OR inverse sweep with HTF liquidity confirmed OR asymmetry 3:1+, price swept buy-side liquidity and rejected, bearish vol bar (close < open, >1.5x vol), price at/below VWAP, RSI not below 20, invalidation level known, effective_score >= 70.

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

### 8. Target Determination from Structure & Patterns

Targets are derived from structure and patterns, NOT fib extensions alone. Priority:

| Priority | Source | How to Determine |
|----------|--------|-----------------|
| 1 | Nearest liquidity pool | Opposite-side EQH/EQL, session high/low, prior swing high/low |
| 2 | Supply/Demand zone boundary | Fresh zone edge opposite entry direction |
| 3 | Order Block | Untested OB high (for shorts) or low (for longs) |
| 4 | Fair Value Gap | FVG boundary opposite entry direction |
| 5 | Previous swing high/low | HH, LH, LL, HL from `_structure` |
| 6 | Pattern completion | Wyckoff target, Elliott Wave 3/5 completion, measured move (AB=CD) |
| 7 | Fib extension | 1.272 / 1.618 (fallback when structural targets are far or absent) |
| 8 | ATR-based | Entry ± 3x ATR (last resort, only if no structural target exists) |

**TP assignment:**
- TP1 = nearest structural target (conservative take-profit, ~1-2R)
- TP2 = primary structural target (high probability, liquidity or zone boundary)
- TP3 = runner / far liquidity (swing completion or range extension)
- EXT = extreme target (fib extension or far liquidity pool)

**RR calculation:**
```
rr_tp1 = abs(tp1 - entry) / abs(stop - entry)
rr_tp2 = abs(tp2 - entry) / abs(stop - entry)
rr_tp3 = abs(tp3 - entry) / abs(stop - entry)
```

---

### 9. Auto Chart Drawing (MANDATORY)

When chart-analysis runs, ALL of the following MUST be drawn on the chart automatically using `draw_shape`. This is required, not optional.

**Setup:**
1. `draw_clear()` — remove all existing drawings first (clean slate)

**Draw entry level:**
```
draw_shape(
  shape: "horizontal_line",
  point: { time: now, price: entry_price },
  overrides: '{"linecolor": "#22c55e", "linewidth": 2, "linestyle": 2}',  // green dashed for long
  text: "ENTRY"
)
```

**Draw stop loss:**
```
draw_shape(
  shape: "horizontal_line",
  point: { time: now, price: stop_price },
  overrides: '{"linecolor": "#ef4444", "linewidth": 2, "linestyle": 0}',  // red solid
  text: "SL"
)
```

**Draw TP1 / TP2 / TP3:**
```
draw_shape(
  shape: "horizontal_line",
  point: { time: now, price: tp1_price },
  overrides: '{"linecolor": "#22c55e", "linewidth": 2, "linestyle": 2}',  // green dashed
  text: "+1R"  // or "TP1"
)
// repeat for tp2 ("+2R") and tp3 ("+3R")
```

**Draw sweep levels (liquidity):**
```
draw_shape(
  shape: "horizontal_line",
  point: { time: now, price: sweep_level },
  overrides: '{"linecolor": "#eab308", "linewidth": 1, "linestyle": 2}',  // yellow dashed
  text: "SWEEP"
)
```

**Draw supply/demand zones (if applicable):**
```
draw_shape(
  shape: "rectangle",
  point: { time: zone_start, price: zone_high },
  point2: { time: zone_end, price: zone_low },
  overrides: '{"linecolor": "#8b5cf6", "fillcolor": "#8b5cf680", "linewidth": 1}'
)
// use purple/violet for demand zones, orange for supply zones
```

**Draw order blocks (if applicable):**
```
draw_shape(
  shape: "rectangle",
  point: { time: ob_time, price: ob_high },
  point2: { time: ob_time_end, price: ob_low },
  overrides: '{"linecolor": "#06b6d4", "fillcolor": "#06b6d420", "linewidth": 1}'
)
```

**Draw FVG zones (if applicable):**
```
draw_shape(
  shape: "rectangle",
  point: { time: fvg_start, price: fvg_high },
  point2: { time: fvg_end, price: fvg_low },
  overrides: '{"linecolor": "#ec4899", "fillcolor": "#ec489920", "linewidth": 1}'
)
```

**Draw forecast projection:**
```
draw_forecast(
  direction: "long" | "short",
  entry: entry_price,
  targets: [tp1, tp2, tp3],
  stop_loss: stop_price,
  bars_forward: 30
)
```

**Color conventions:**
| Element | Color |
|---------|-------|
| Entry (long) | Green (#22c55e) |
| Entry (short) | Red (#ef4444) |
| Stop loss | Red solid (#ef4444) |
| TP levels | Green dashed (#22c55e) |
| Sweep levels | Yellow dashed (#eab308) |
| Demand zones | Purple (#8b5cf6) |
| Supply zones | Orange (#f97316) |
| Order blocks | Cyan (#06b6d4) |
| FVG zones | Magenta (#ec4899) |

**Screenshot:**
```
capture_screenshot(filename="setup")
```

---

## Output

```
{
  checklist_passed: true | false,
  entry_executed: true | false,
  entry_price_executed: float | null,
  tp1: { price: float, source: "LIQUIDITY | S_D_ZONE | OB | FVG | SWING | PATTERN | FIB | ATR" },
  tp2: { price: float, source },
  tp3: { price: float, source },
  ext: { price: float, source },
  annotations_drawn: ["entry", "stop", "tp1", "tp2", "tp3", "forecast", "sweep", "zones", "obs", "fvgs"],
  screenshot_path: "screenshots/..."
}
```

## Next
Pass to `_report`
