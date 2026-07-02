---
name: chart-analysis
description: QuantMirror V4 framework — multi-timeframe SMC (BOS/CHOCH/MSS/OB/Breakers/MitB/FVG/IFVG/Liquidity Pools), volume analysis, Wyckoff, premium/discount, divergence. Modular analysis system.
---

# Chart Analysis — QuantMirror V4 Framework

Core principle: **Price is a lagging indicator. Volume is a leading indicator. Structure is the context.**

## Module Architecture

| Module | File | Purpose |
|--------|------|---------|
| System | `system.md` | Global rules, MCP tool setup, context management, data acquisition |
| Market Regime | `market-regime.md` | Multi-timeframe volume analysis, trend regime classification |
| Structure | `structure.md` | SMC: BOS/CHOCH/MSS, order blocks, FVGs, liquidity pools, Wyckoff phases |
| Volume & VSA | `volume-vsa.md` | VSA bar types, effort vs result divergence |
| Decision Engine | `decision-engine.md` | Confluence scoring, conviction sizing, risk framework, reporting template |

---

## Analysis Workflow

Execute in order.

### Step 0: Initialize & Acquire Data

```
chart_get_state()       # Current state, entity IDs
quote_get()             # Real-time price
```

Gather data across the timeframe range: W → D → 4H → 60 → 15. Switch timeframes and collect data per TF.

### Step 1: Assess Market Regime
See `market-regime.md` — volume analysis, trend classification.

### Step 2: Analyze Structure
See `structure.md` — SMC + Wyckoff.

Identify: BOS/CHOCH direction, liquidity sweeps, order blocks, FVGs, premium/discount zone, Wyckoff phase.

### Step 3: Read Volume & VSA
See `volume-vsa.md` — VSA bar types.

Classify: Recent bar VSA signatures, effort vs result divergence.

### Step 4: Score & Decide
See `decision-engine.md` — confluence, risk, reporting.

Execute: 11-point confluence checklist, conviction sizing, risk validation.

---

## Execution Flow

```
[ ] 1. System setup — session init, data acquisition (system.md)
[ ] 2. Market regime — volume across TFs (market-regime.md)
[ ] 3. Structure — SMC, Wyckoff phase (structure.md)
[ ] 4. Volume & VSA — bar reading (volume-vsa.md)
[ ] 5. Confluence score — decision (decision-engine.md)
[ ] 6. Report — QuantMirror V4 template
[ ] 7. Cleanup — leave key drawings, remove excess
```

**No trade if confluence < 8/11 or R:R < 2.**
