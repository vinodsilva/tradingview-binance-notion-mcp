---
name: _execution
description: Entry triggers, trade management, pyramiding, exits, chart annotations
---

# Execution — Solid Anchor Model: Hunting Limit Entries with TP/SL

## CORE PHILOSOPHY

> Don't chase price. Let price come to you.

The solid anchor model replaces reactive market entries with proactive limit orders at structural levels. Every entry is a **hunting limit** — placed at a high-conviction anchor and filled only when price returns to that level. No chasing, no FOMO, no market orders on breakouts.

## Dependencies
- `_structure` -> best_anchor (price, type, quality), anchors[], OBs, FVGs, sweeps
- `_confluence` -> decision, anchor entry_model, grade, win_probability
- `_sizing` -> stop placement relative to anchor

## StEngine Strategy Alignment

| Parameter | Strategy Default | MCP Override (Anchor Model) |
|-----------|-----------------|------------------------------|
| Stop Loss | 2x avg_range from entry | Structural stop BEYOND anchor level (0.3 avg_range buffer) |
| Take Profit | 3x avg_range from entry | Structural TP at next liquidity / zone boundary |
| Entry Trigger | Market on signal | LIMIT at anchor level — only enters when price reaches anchor |
| Partial TP | 50% at 2x avg_range | 25% at +1R, 25% at +2R, 50% runner |
| Flip on opposite | YES | Same |
| CHoCH exit | YES | Same |

**Anchor model override:** If confluence produces SOLID_ANCHOR_HUNT setup type, disable strategy's built-in entry trigger and use MCP-managed limit orders at the anchor level.

---

## STEPS

### 0. ANCHOR IDENTIFICATION (Before Entry)

From `_structure.anchors[]`, select the **best anchor**:

```
Selection priority:
1. Highest quality score (80+ SOLID grade)
2. Most converging types at same price level
3. Closest to current price (within 1-2 avg_range)
4. Direction matches confluence decision
```

If no anchor has quality ≥ 60 → no limit entry is placed. Fall back to market-on-sweep only.

---

### 1. ENTRY CHECKLIST — ANCHOR HUNT MODEL

**EV pre-check:** EV_ratio must be > 0.3. If EV_ratio <= 0.3 → NO ENTRY regardless of other conditions.

**Anchor pre-check:** `_structure.best_anchor.quality` >= 60. If no valid anchor → skip limit entry, fall back to sweep-reactive entry only.

**Long (Limit Buy at Anchor):**
- Solid anchor identified (OB low / FVG CE / demand zone / OTE 0.618-0.786)
- Anchor quality ≥ 60 (VALID or SOLID grade)
- HTF trend bullish OR inverse sweep with HTF liquidity confirmed
- Price currently ABOVE the anchor level (price must come down to fill limit)
- Anchor within 2 avg_range of current price (not too far to wait)
- RSI not oversold on entry TF unless part of divergence setup
- Invalidation level known (beyond anchor by 0.5 avg_range)
- effective_score >= 70 from confluence

**Short (Limit Sell at Anchor):**
- Solid anchor identified (OB high / FVG CE / supply zone / OTE 0.618-0.786)
- Anchor quality ≥ 60 (VALID or SOLID grade)
- HTF trend bearish OR inverse sweep with HTF liquidity confirmed
- Price currently BELOW the anchor level (price must rally up to fill limit)
- Anchor within 2 avg_range of current price
- RSI not overbought on entry TF unless part of divergence setup
- Invalidation level known (beyond anchor by 0.5 avg_range)
- effective_score >= 70 from confluence

**Anchor Hunting Rule:** Place limit at anchor price. If price reaches within 0.1 avg_range of the anchor level AND shows a rejection candle (pin, engulfing, volume spike) on the entry TF → entry triggers. If price blows through anchor without reaction (>0.5 avg_range beyond) → cancel limit, anchor is invalidated.

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
| +1R | Sell 25% -> move stop to breakeven |
| +2R | Sell 25% -> trail stop by 1 avg_range |
| +3R | Sell 25% -> trail stop by 1.5 avg_range |
| Runner | Hold 25% with trailing stop |

### 4. Trailing Stop
Trail at previous swing low/high (structure-based). Never loosen - only tighten.

### 5. Time Stop (Seykota)
If price hasn't moved 0.5x avg_range in your favor within 5 bars on entry TF -> exit.

### 6. Invalidation Monitoring
Check every bar:
- Trend flips (UP->DOWN for long, DOWN->UP for short) -> EXIT immediately
- Structure score collapses (sustained break of key OB/FVG) -> EXIT

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

### 8. Target Determination — Anchor-Relative Model

Targets are derived **from the anchor outward**, not from entry price. The anchor is the reference point for both stop and targets.

#### Stop Placement (Anchor-Relative)

```
Long (limit buy):
  Entry: anchor price (OB low / FVG CE / demand zone / OTE level)
  Stop: below anchor low by 0.3 avg_range buffer
  Stop must be BEYOND any sweep wick at this level
  Never place stop inside the anchor zone

Short (limit sell):
  Entry: anchor price (OB high / FVG CE / supply zone / OTE level)
  Stop: above anchor high by 0.3 avg_range buffer
  Stop must be BEYOND any sweep wick at this level
  Never place stop inside the anchor zone
```

#### TP Derivation (Priority Order)

| Priority | Source | How to Determine |
|----------|--------|-----------------|
| 1 | Opposite anchor boundary | The corresponding opposite-side anchor at the next structural level |
| 2 | Nearest liquidity pool | Opposite-side EQH/EQL, session high/low, prior swing high/low |
| 3 | Supply/Demand zone boundary | Fresh zone edge opposite entry direction |
| 4 | Order Block | Untested OB high (for shorts) or low (for longs) |
| 5 | Fair Value Gap | FVG boundary opposite entry direction |
| 6 | Previous swing high/low | HH, LH, LL, HL from `_structure` |
| 7 | Pattern completion | Wyckoff target, Elliott Wave 3/5 completion, measured move (AB=CD) |
| 8 | Fib extension | 1.272 / 1.618 (fallback when structural targets are far or absent) |
| 9 | ATR-based | Entry +/- 3x avg_range (last resort, only if no structural target exists) |

**Anchor-specific TP assignment:**
- TP1 = nearest structural target beyond the anchor (conservative, ~1-2R)
- TP2 = primary liquidity or zone boundary target
- TP3 = runner / far liquidity (swing completion or range extension)
- EXT = extreme target (fib extension or far liquidity pool)

**RR calculation (anchor-relative):**
```
risk = abs(entry - stop)  // risk per unit from anchor entry to structural stop
rr_tp1 = abs(tp1 - entry) / risk
rr_tp2 = abs(tp2 - entry) / risk
rr_tp3 = abs(tp3 - entry) / risk
```

**Minimum RR for anchor model:**
- SOLID anchor (80+): minimum 2.5:1 RR
- VALID anchor (60-79): minimum 3:1 RR
- Below 60: limit entry not recommended

---

### 9. Auto Chart Drawing (MANDATORY)

When chart-analysis runs, ALL of the following MUST be drawn on the chart automatically using `draw_shape`. This is required, not optional.

**Setup:**
1. `draw_clear()` - remove all existing drawings first (clean slate)
2. `chart_get_state()` → get indicator entity IDs from `studies[]`, store in a list
3. Hide all indicators via `indicator_toggle_visibility(entity_id, false)` for each study — ensures clean screenshot with only annotations

**Anchor emphasis — the anchor level is the PRIMARY annotation:**
The anchor level is the reference point for the entire setup. It must be the most prominent drawing on the chart.

**Label overlap prevention:**
All horizontal line labels must use time offsets so they don't stack on top of each other. Calculate `bar_secs` from resolution:
- 1m=60, 5m=300, 15m=900, 1h=3600, 4h=14400, D=86400
- `offset = resolution_in_seconds * 2` (2 bars between each label)

```
bar_secs = tf_to_seconds(resolution)  // e.g., 15m = 900
spacing = bar_secs * 2                // 1800 for 15m
anchor_time = now - spacing * 3       // furthest left — anchor is reference
sweep_time = now - spacing * 2        // left
sl_time = now - spacing               // left of entry
entry_time = now                      // center (same as anchor for limit entries)
tp1_time = now + spacing              // right of entry
tp2_time = now + spacing * 2          // further right
tp3_time = now + spacing * 3          // furthest right
```

**Draw anchor level (furthest left — the structural reference):**
```
draw_shape(
  shape: "horizontal_line",
  point: { time: anchor_time, price: anchor_price },
  overrides: '{"linecolor": "#a855f7", "linewidth": 3, "linestyle": 0}',
  text: "ANCHOR: [type]"
)
// Purple solid, thickest line — the anchor is the most important level
```

**Draw sweep level (left side):**
```
draw_shape(
  shape: "horizontal_line",
  point: { time: sweep_time, price: sweep_level },
  overrides: '{"linecolor": "#eab308", "linewidth": 1, "linestyle": 2}',
  text: "SWEEP"
)
```

**Draw stop loss (left of entry):**
```
draw_shape(
  shape: "horizontal_line",
  point: { time: sl_time, price: stop_price },
  overrides: '{"linecolor": "#ef4444", "linewidth": 2, "linestyle": 0}',
  text: "SL"
)
```

**Draw entry level (center — same as anchor for limit entries):**
```
draw_shape(
  shape: "horizontal_line",
  point: { time: entry_time, price: entry_price },
  overrides: '{"linecolor": "#22c55e", "linewidth": 2, "linestyle": 2}',
  text: "ENTRY @ ANCHOR"
)
```

**Draw TP levels (right side, spread out):**
```
draw_shape(
  shape: "horizontal_line",
  point: { time: tp1_time, price: tp1_price },
  overrides: '{"linecolor": "#22c55e", "linewidth": 2, "linestyle": 2}',
  text: "+1R"
)

draw_shape(
  shape: "horizontal_line",
  point: { time: tp2_time, price: tp2_price },
  overrides: '{"linecolor": "#22c55e", "linewidth": 2, "linestyle": 2}',
  text: "+2R"
)

draw_shape(
  shape: "horizontal_line",
  point: { time: tp3_time, price: tp3_price },
  overrides: '{"linecolor": "#22c55e", "linewidth": 2, "linestyle": 2}',
  text: "+3R"
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
  point2: { time: ob_end, price: ob_low },
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

**Anchor zone rectangle (if anchor is a zone, not a single price):**
```
draw_shape(
  shape: "rectangle",
  point: { time: anchor_start, price: anchor_zone_high },
  point2: { time: anchor_end, price: anchor_zone_low },
  overrides: '{"linecolor": "#a855f7", "fillcolor": "#a855f730", "linewidth": 2}'
)
// Purple fill — visually marks the anchor zone where limit entry is placed
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
capture_screenshot(filename="setup")  // clean — indicators hidden
```

**Restore indicators after screenshot:**
```
// Re-show all indicators via indicator_toggle_visibility(entity_id, true) for each
// Use the entity IDs stored in step 2 of Setup
```

---

## Output

```
{
  entry_model: "LIMIT_AT_ANCHOR | MARKET_ON_SWEEP | NONE",
  anchor: {
    price: float,
    type: "ORDER_BLOCK | FVG_CE | SD_ZONE | OTE | SWEEP | PD_ARRAY | POC",
    quality: int,
    grade: "SOLID | VALID | WEAK",
    convergence_types: [],
    convergence_count: int
  },
  checklist_passed: true | false,
  limit_placed: true | false,
  entry_executed: true | false,
  entry_price_executed: float | null,
  stop: {
    price: float,
    type: "BEYOND_ANCHOR | BEYOND_SWEEP",
    buffer: float
  },
  tp1: { price: float, source: "OPPOSITE_ANCHOR | LIQUIDITY | S_D_ZONE | OB | FVG | SWING | PATTERN | FIB" },
  tp2: { price: float, source },
  tp3: { price: float, source },
  ext: { price: float, source },
  annotations_drawn: ["anchor", "entry", "stop", "tp1", "tp2", "tp3", "forecast", "sweep", "zones", "obs", "fvgs"],
  screenshot_path: "screenshots/..."
}
```

## Next
Pass to `_report`
