---
name: _report
description: Structured trade report, chart representation, edge tracking, decision log
---

# Report — Output & Chart Visualization

## Dependencies
- All prior modules → produces final report + annotated chart

## Inputs
```
{
  "setup": { style, session, entity_ids, current_price, symbol, tf_data },
  "structure": {
    liquidity: { grade, dominant_side },
    structure: { trend, bos, choch, state },
    atr_pct: float,
    order_blocks: [{ type, status, strength, high, low }],
    fvg: [{ type, status, strength, high, low }],
    inducement: { detected },
    wyckoff: { phase, event },
    elliott: { valid, context },
    fib_clusters: [{ grade, strength }],
    vacuum_zone: bool,
    structure_score: int
  },
  "volume": { bars_classified, scalp_patterns, stop_hunts, divergences, dominant_signature },
  "orderflow": { topology, bid_ask_ratio, verdict },
  "confluence": { style, direction, conviction, score, scoring_table, must_pass_failures, ew_override, asymmetry_ratio, atr_pct, entry_zone, no_trade_reason, rr },
  "sizing": { direction, account_risk_pct, account_risk_usd, kelly_fraction, position_size, leverage, stop_distance_units, stop_price, stop_type, entry_price, rr, confidence_level },
  "execution": { checklist_passed, entry_executed, entry_price_executed, tp1, tp2, pyramiding, annotations_drawn, screenshot_path }
}
```

## Steps

### 1. Chart Representation — Draw the Trade Idea

Use MCP drawing tools to visualize the complete trade plan on the TradingView chart. This is the primary visual output.

#### Core Levels

```python
ts = current_bar_timestamp  # from chart_get_state or latest OHLCV bar

# Long template
draw_shape(shape="text", point={time: ts, price: entry}, text="LONG → +2R")
draw_shape(shape="horizontal_line", point={time: ts, price: entry},
           overrides='{"linecolor":"#00ff00","linewidth":2,"linestyle":0}')
draw_shape(shape="horizontal_line", point={time: ts, price: stop},
           overrides='{"linecolor":"#ff0000","linewidth":2,"linestyle":0}',
           text="SL")
draw_shape(shape="horizontal_line", point={time: ts, price: tp1},
           overrides='{"linecolor":"#00ff00","linewidth":1,"linestyle":2}',
           text="+1R")
draw_shape(shape="horizontal_line", point={time: ts, price: tp2},
           overrides='{"linecolor":"#00ff00","linewidth":1,"linestyle":2}',
           text="+2R")

# Short template
draw_shape(shape="text", point={time: ts, price: entry}, text="SHORT → +2R")
draw_shape(shape="horizontal_line", point={time: ts, price: entry},
           overrides='{"linecolor":"#ff0000","linewidth":2,"linestyle":0}')
draw_shape(shape="horizontal_line", point={time: ts, price: stop},
           overrides='{"linecolor":"#ff0000","linewidth":2,"linestyle":0}',
           text="SL")
draw_shape(shape="horizontal_line", point={time: ts, price: tp1},
           overrides='{"linecolor":"#00ff00","linewidth":1,"linestyle":2}',
           text="+1R")
draw_shape(shape="horizontal_line", point={time: ts, price: tp2},
           overrides='{"linecolor":"#00ff00","linewidth":1,"linestyle":2}',
           text="+2R")
```

#### Structural Annotations

Label key structural levels identified by `_structure`:

| Level | Color | Style | Label |
|-------|-------|-------|-------|
| Sweep level | Yellow (`#ffff00`) | 2pt, dashed | "SWEEP" |
| Order block zone | Cyan (`#00ffff`) | 1pt, dotted | "OB" |
| FVG zone | Magenta (`#ff00ff`) | 1pt, dotted | "FVG" |
| Fib cluster | Orange (`#ff8800`) | 1pt, dashed | "FIB" |
| Divergence point | White (`#ffffff`) | Text label only | "DIV: [type]" |

```python
# Example: draw sweep level
if volume.stop_hunts:
    s = volume.stop_hunts[-1]
    draw_shape(shape="horizontal_line", point={time: ts, price: s.level},
               overrides='{"linecolor":"#ffff00","linewidth":2,"linestyle":2}',
               text=f"SWEEP {s.direction}")

# Example: draw OB zone
if structure.order_blocks:
    ob = structure.order_blocks[-1]
    draw_shape(shape="rectangle",
               point={time: ts, price: ob.high},
               point2={time: ts + 3600, price: ob.low},  // 1h forward
               overrides='{"linecolor":"#00ffff","linecolor2":"#00ffff","linestyle":3}',
               text=f"OB {ob.status}")
```

#### Forecast Line

Use `draw_forecast` to project the expected move:

```python
draw_forecast(
    direction="long" if LONG else "short",
    entry=entry_price,
    targets=[{"price": tp1, "label": "TP1 +1R"}, {"price": tp2, "label": "TP2 +2R"}],
    stop_loss=stop_price,
    bars_forward=12  // ~3h on 15M, ~12h on 1H
)
```

#### R:R Visual

```python
rr_text = f"R:R {rr.actual}:1 | Entry {entry_price} | SL {stop_price} | TP {tp2}"
draw_shape(shape="text", point={time: ts, price: entry}, text=rr_text)
```

### 2. Build Text Report

#### Structure Direction
```
Trend: [UP/DOWN/RANGE] — BOS: [BULLISH/BEARISH/null] — Score: [X/100]
Liquidity Grade: [S/A/B/C] — Zone: [buy_side/sell_side]
Vacuum zone: [true/false] — Inducement: [true/false]
```

#### Multi-TF Structure
```
Liquidity dominant side: [buy_side/sell_side]
Structure state: [ACCUMULATION/DISTRIBUTION/TRENDING/RANGING]
Wyckoff phase: [A/B/C/D/E/null]
Elliott: [valid/invalid] — [context]
```

#### Confluence Score
```
Conviction: [SNIPER/NORMAL/HALF/NO_TRADE] — Score: [X/16 or X/15]
Key factors: [top 3 passing factors]
Weak factors: [any must-pass failures]
```

#### Asymmetry
```
Entry: [price] | SL: [price] ([dist%]) | TP1: [price] (+[R]:1) | TP2: [price] (+[R]:1)
R:R: [X]:1 — [Greenlit/Rejected]
```

#### Volume Context
```
Dominant signature: [IMPULSE/ABSORPTION/COMPRESSION/null]
Divergence: [type] — Strength: [1.0-3.0]
Stop hunts: [count] detected
```

#### Trade Plan (If Trade Executed)
```
Direction:        [Long/Short]
Entry:            [Price]
Invalidation:     [Price — structural]
Position Size:    [X units]
Leverage:         [Xx]
Stop:             [X ATR / $X]
TP1 (+1R):        [Price]
TP2 (+2R):        [Price]
Account Risk:     [X% — $X]
```

#### Decision
**[LONG / SHORT / NO_TRADE]** — [One-sentence rationale]

### 3. Screenshot

```python
# Must run AFTER all annotations are drawn
screenshot_path = capture_screenshot(region="chart", filename=f"{symbol}_{date}_trade_plan")
capture_screenshot(region="full", filename=f"{symbol}_{date}_full_context")
```

The chart screenshot captures the complete visual trade plan: entry, SL, TP levels, structural zones, and forecast.

### 4. Cleanup

```python
if trade_executed:
    keep_drawings = True  # user reviews annotated chart
else:
    draw_clear()  # no trade — clean up
```

Leave indicators on chart (unless asked to remove).

### 5. Edge Tracking (After Every Trade)

```
Setup Type:           [Trend Follow / VCP / Reversal / Range]
Win/Loss:             [W / L]
R:R Realized:         [X.X]
Execution Quality:    [Good / Slippage / Missed]
Entry TF Conviction:  [1-5]
Notes:                [What went right/wrong]
```

#### Update Edge Calculation (Every 30 Days)
```
Edge = (Avg Win_R x WinRate) - (Avg Loss_R x LossRate)
If edge > 0.3 → continue with confidence
If edge < 0.1 → reassess setup criteria
If edge < 0 → stop trading this setup entirely
```

### 6. Post-Trade Journal

```
[ ] Journal: entry, exit, R:R, structure score, OB/FVG mit status
[ ] Screenshot the setup for review
[ ] Note: which TF invalidated first (if stopped out)
[ ] Review weekly: win rate by structure pattern, OB/FVG hit rate, most common invalidation TF
```

## Output

```
{
  "report": {
    "date": "2025-01-15",
    "symbol": "EURUSD",
    "decision": "LONG | SHORT | NO_TRADE",
    "reason": "String summary of the full analysis",
    "structure_score": 92,
    "confluence_score": 14,
    "conviction": "SNIPER",
    "direction": "LONG",
    "entry_price": 1.0450,
    "stop_price": 1.0425,
    "tp1": 1.0525,
    "tp2": 1.0600,
    "rr": 2.3
  },
  "edge_log": {
    "setup_type": "Trend Follow",
    "result": "W" | "L" | null,
    "rr_realized": 2.1,
    "execution_quality": "Good",
    "notes": "Sweep confirmed, volume confirmed, R:R hit T2"
  },
  "annotations_drawn": ["entry", "stop", "tp1", "tp2", "sweep", "ob", "forecast"],
  "screenshot_paths": ["screenshots/2025-01-15_EURUSD_trade_plan.png"],
  "cleanup_done": true
}
```
