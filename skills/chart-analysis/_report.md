---
name: _report
description: Chart annotations, text report, screenshot, cleanup
---

# Report — Chart Visualization & Output

## Dependencies
All prior modules → annotated chart + report

## Steps

### 1. Draw Trade Plan on Chart
Use `draw_shape` to visualize the complete trade plan:

```
# Entry line + label
draw_shape(shape="horizontal_line", point={time: ts, price: entry_price},
           overrides='{"linecolor":"#00ff00","linewidth":2}')
draw_shape(shape="text", point={time: ts, price: entry_price}, text="LONG → +2R")

# Stop loss
draw_shape(shape="horizontal_line", point={time: ts, price: stop_price},
           overrides='{"linecolor":"#ff0000","linewidth":2}', text="SL")

# Targets
draw_shape(shape="horizontal_line", point={time: ts, price: tp1},
           overrides='{"linecolor":"#00ff00","linewidth":1,"linestyle":2}', text="+1R")
draw_shape(shape="horizontal_line", point={time: ts, price: tp2},
           overrides='{"linecolor":"#00ff00","linewidth":1,"linestyle":2}', text="+2R")
```

**Color scheme:** Green = profit zone, Red = loss zone, Yellow = sweep/structural, Cyan = OB, Magenta = FVG.

### 2. Draw Structural Annotations
- Sweep levels: yellow dashed, `text="SWEEP"`
- OBs: cyan dotted rectangle from OB high to OB low
- FVGs: magenta dotted rectangle from FVG high to FVG low
- Fib clusters: orange dashed, `text="FIB"`
- Divergence: white text, `text="DIV: [type]"`

### 3. Draw Forecast Projection
`draw_forecast(direction, entry, targets, stop_loss, bars_forward=12)`

### 4. Build Text Report

```
Trend: [UP/DOWN/RANGE] — BOS: [BULLISH/BEARISH/null]
Conviction: [SNIPER/NORMAL/HALF/NO_TRADE] — Score: [X/11]
Entry: [price] | SL: [price] | TP1: [price] (+[R]:1) | TP2: [price] (+[R]:1)
R:R: [X]:1
Volume: [IMPULSE/ABSORPTION/COMPRESSION/MIXED]
Divergence: [type] — Strength: [1.0-3.0]

Decision: [LONG / SHORT / NO_TRADE] — [One-sentence rationale]
```

### 5. Take Screenshots
```
capture_screenshot(region="chart", filename=f"{symbol}_{date}_trade_plan")
capture_screenshot(region="full", filename=f"{symbol}_{date}_full_context")
```

### 6. Cleanup
- If trade executed: leave drawings for review
- If NO TRADE: `draw_clear()` to remove excess annotations
- Leave indicators on chart

## Output

```
{
  report: {
    symbol, date, decision, reason,
    structure_score, confluence_score,
    conviction, direction,
    entry_price, stop_price, tp1, tp2, rr
  },
  annotations_drawn: ["entry", "stop", "tp1", "tp2", "forecast", ...],
  screenshot_paths: ["screenshots/..."],
  cleanup_done: true
}
```
