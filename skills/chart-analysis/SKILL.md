---
name: chart-analysis
description: QuantMirror V4 Institutional framework — multi-timeframe SMC (BOS/CHOCH/MSS/OB/Breakers/MitB/FVG/IFVG/Premium-Discount/Liquidity Pools), VSA, Wyckoff, Market Profile (POC/VAH/VAL/HVN/LVN), Auction Market Theory, Volume Profile, Elliott Wave, hidden divergence. Modular analysis system.
---

# Chart Analysis — QuantMirror V4 Institutional Framework

Integrates: **QuantMirror V4 Decision Model** | Smart Money Concepts (BOS/CHOCH/MSS/OB/Breakers/Mitigation Blocks/FVG/IFVG/Premium-Discount/Liquidity Pools) | Market Profile (POC/VAH/VAL) | Auction Market Theory (Balance/Imbalance/Acceptance/Rejection/Excess) | Volume Profile (Composite/Session/HVN/LVN) | Wyckoff Method | Volume Spread Analysis | Elliott Wave with Fibonacci | Hidden Divergence

Core principle: **Price is a lagging indicator. Volume is a leading indicator. Structure is the context.**

## Module Architecture

This skill is organized into focused modules. Each module is self-contained with its own MCP tool references:

| Module | File | Purpose |
|--------|------|---------|
| System | `system.md` | Global rules, QuantMirror 3-layer architecture, weighted decision model, MCP tool setup, context management, data acquisition |
| Market Regime | `market-regime.md` | Multi-timeframe volume profile, Market Profile (POC/VAH/VAL), Auction Market Theory, Volume Profile (HVN/LVN), volume hierarchy, signatures, trend regime classification, price/trend filters |
| Structure | `structure.md` | SMC: BOS/CHOCH/MSS, order blocks, breakers, mitigation blocks, FVGs, Inverse FVGs, Premium/Discount Arrays, Liquidity Pools, Wyckoff phases A-E, MTF integration |
| Volume & VSA | `volume-vsa.md` | 9 VSA bar types, effort vs result divergence, regular & hidden divergence detection |
| Order Flow | `orderflow.md` | DOM depth, delta estimation, bid/ask pressure, absorption patterns |
| Elliott Wave | `elliott.md` | Mandatory wave rules, wave identification, Fibonacci validation |
| Decision Engine | `decision-engine.md` | 7-factor & 10-point confluence, conviction sizing, risk framework, reporting template, execution flow, MCP tool map |

---

## Analysis Workflow

Execute in order. Each step references its dedicated module.

### Step 0: Initialize & Acquire Data
See `system.md` — MCP Tool Setup & Step 0.

```
chart_get_state()       # Current state, entity IDs
quote_get()             # Real-time price
pine_set_source("...")  # Inject MTF Data Collector script (see system.md)
pine_smart_compile()    # Compile → table appears on chart
data_get_pine_tables()  # Read all TF summary stats in one call
```

Gather data across the full timeframe range: W → D → 6H → 4H → 60 → 15 → 5. Use a single Pine Script with `request.security()` to collect all 7 TFs simultaneously (see `system.md`).

### Step 1: Assess Market Regime
See `market-regime.md` — market profile, volume profile, auction market theory, trend.

Determine: Market Profile structure (POC/VAH/VAL), Volume Profile (HVN/LVN), Auction Market phase (Balance/Imbalance/Acceptance/Rejection/Excess), HTF volume trend, volume signatures, trend regime classification.

### Step 2: Analyze Structure
See `structure.md` — SMC + Wyckoff.

Identify: BOS/CHOCH direction, liquidity sweeps, order blocks, breakers/mitigation blocks, FVGs/IFVGs, premium/discount zone, liquidity pools, Wyckoff phase (A-E) on primary timeframe.

### Step 3: Read Volume & VSA
See `volume-vsa.md` — VSA bar types + divergence.

Classify: Recent bar VSA signatures (types 1-9), effort vs result divergence, regular/hidden RSI divergence across timeframes.

### Step 4: Analyze Order Flow
See `orderflow.md` — DOM, delta, bid/ask pressure.

Check: DOM depth (depth_get), delta estimation from bars, absorption patterns, bid/ask ratio, cum delta trend.

### Step 5: Count Elliott Waves
See `elliott.md` — wave counting + Fibonacci.

Apply: 4 mandatory rules, identify wave position, validate with Fibonacci retracements/extensions.

### Step 6: Score & Decide
See `decision-engine.md` — confluence, risk, reporting.

Execute: 10-point confluence checklist, conviction sizing, risk validation (R:R >= 2), ATR-based position sizing.

---

## Execution Flow

```
[ ] 1. System setup — session init, data acquisition (system.md)
[ ] 2. Market regime — volume profile across TFs (market-regime.md)
[ ] 3. Structure — SMC, Wyckoff phase (structure.md)
[ ] 4. Volume & VSA — bar reading, divergence (volume-vsa.md)
[ ] 5. Order flow — DOM, absorption (orderflow.md)
[ ] 6. Elliott Wave — count, Fibonacci (elliott.md)
[ ] 7. Confluence score — decision (decision-engine.md)
[ ] 8. Report — QuantMirror V4 template
[ ] 9. Cleanup — leave key drawings, remove excess
```

**No trade if confluence < 7/10 or R:R < 2.**
