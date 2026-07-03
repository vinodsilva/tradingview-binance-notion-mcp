---
name: _setup
description: System — data acquisition, MCP tool setup, context management
---

# Chart Analysis — QuantMirror V4 Framework

Core principle: **Price is a lagging indicator. Volume is a leading indicator. Structure is the context.**

## Pipeline

| Step | Module | Purpose |
|------|--------|---------|
| 0 | `_setup` | Data acquisition, chart state, context management |
| 1 | `_volume` / `market-regime` | Multi-TF volume analysis, trend regime |
| 2 | `_structure` | SMC: BOS/CHOCH, OBs, FVGs, liquidity, Wyckoff |
| 3 | `_confluence` / `decision-engine` | Confluence scoring, conviction sizing, risk |
| 4 | `_report` | QuantMirror report |

---

## Step 0: Initialize & Acquire Data

```
chart_get_state()       # Current state, entity IDs
quote_get()             # Real-time price
```

Gather data across the timeframe range: W → D → 4H → 60 → 15. Switch timeframes and collect data per TF.

Collect from custom indicators (per visible study):
- `data_get_pine_lines`, `data_get_pine_labels`, `data_get_pine_tables`, `data_get_pine_boxes`

Determine session from current time + symbol.

## Output

Assemble into `{ symbol, entry_tf, current_price, session, entity_ids, tf_data, pine_levels, study_values }`

## Next

Pass to `_volume` (market-regime) → `_structure` → `_confluence` (decision-engine) → `_report`

**No trade if confluence < 8/11 or R:R < 2.**
