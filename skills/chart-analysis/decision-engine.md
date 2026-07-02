---
name: decision-engine
description: Confluence scoring, trade grading, risk management, reporting template, execution flow
---

# Decision Engine — Confluence, Risk & Execution

## QuantMirror V4 11-Point Confluence

| # | Factor | What It Tests | Y/N |
|---|--------|---------------|-----|
| 1. | Trend alignment | HTF direction matches trade direction | |
| 2. | BOS / CHOCH confirmation | Structure break in trade direction with volume | |
| 3. | Sweep direction matches trade | A/B-grade sweep/inducement direction supports trade | |
| 4. | Order Block / FVG interaction | Price at OB/FVG that supports trade direction | |
| 5. | Fibonacci confluence | Retracement at 0.382-0.65 in trade direction | |
| 6. | Volume confirmation | Bar at key level has volume > 1.5x avg | |
| 7. | Wyckoff phase support | Phase aligns with trade direction | |
| 8. | Momentum confirmation | RSI supports (oversold in uptrend, overbought in downtrend) | |
| 9. | VSA alignment | Recent VSA bars consistent with thesis | |
| 10. | DOM directional bias | Bid/ask ratio supports direction (if available) | |
| 11. | Risk management validation | R:R >= 2, stop structurally placed | |

**Score: X/11 | Reject if < 8/11**

**Important: Sweep (#3) is DIRECTIONAL.** Sell-side sweep (low taken out, close back above) → scores Y only for LONG. Buy-side sweep (high taken out, close back below) → scores Y only for SHORT.

### Conviction Sizing

```
11/11 → Full size. Sniper entry.
9-10/11 → Normal size (0.75x)
8/11 → Half size (0.5x)
<8/11 → NO TRADE
```

---

## Risk Framework

### Stop Placement Rules

| Condition | Stop Level |
|-----------|-----------|
| Wyckoff Spring entry | Below spring wick low minus ATR/2 |
| Hidden divergence long | Below the higher low forming divergence |
| Regular divergence long | Below the lower low (divergence origin) |
| VSA absorption long | Below the absorption bar low |
| Order Block entry | Below/above OB range by ATR/4 |

### Risk Rules

- Max account risk per trade: 0.5-1%
- Max portfolio exposure: 3%
- Structural stop-loss (not dollar-based)
- No trade if confluence < 8/11 or R:R < 2

### Absolute No-Trade Rules (Override All Analysis)

| Rule | Condition |
|------|-----------|
| No shorting parabolic | LOW_CAP_PARABOLIC regime active. W RSI > 85 + rising volume + price above W EMA 50. |
| No shorting at ATH | Price above all-time high. No resistance above. Only long until W + D CHOCH. |
| No buying at ATL | Price below all-time low. No support below. Only short until W + D CHOCH. |
| No trading no-man's land | Price between key levels with no sweep or inducement of either. |
| No trading news events | Within 30 min of FOMC, CPI, NFP, earnings. |
| No trading all-balance | W + D + 4H all show Range/Balance. No directional edge. |

### Contrarian Sweep Rules

| Condition | Action |
|-----------|--------|
| Sweep Grade A + counter to HTF trend | Tradeable at 0.5x size. Must have 60M BOS confirmation after sweep. Stop beyond sweep wick. |
| Sweep Grade B + counter to HTF trend | NO TRADE. Wait for HTF to neutralize. |
| Sweep Grade C + counter to HTF trend | Skip entirely. |
| Sweep Grade A/B + aligned with HTF trend | Full size. Add on pullback. |
| Multiple sweeps same level (2+) counter to HTF | Higher probability. Grade B tradeable at 0.5x with 60M confirmation. |

### Trend Position Classification

| Position | Definition | Sweep Reliability | Action |
|----------|------------|-------------------|--------|
| **Early** | Trend just began (1-2 BOS/CHOCH from range break) | **MEDIUM** | Trade direction with 0.5x size. Add on 2nd BOS. |
| **Mid** | Trend established (3+ BOS). Price in middle 50% of range. | **LOW** | Trade direction with full size. Fade counter-trend at 0.25x. |
| **Late** | Price at prior HTF swing point. 2+ sweeps already. RSI extended. | **HIGH** | Anticipate reversal. Grade A sweep + late trend = sniper. |

---

## Reporting

### QuantMirror V4 Report Template

```
### Multi-Timeframe Volume Overview
W: [Volume trend, close vs EMA]
D: [Volume trend, close vs EMA]
4H: [Volume trend]
60: [Volume trend]
15: [Volume trend]

### SMC Structure Analysis
Market Structure: [Bullish/Bearish/Neutral]
BOS/CHOCH: [Detected direction + confirmation]
Liquidity: [Sweep detected at level — Bullish/Bearish]
OB/FVG: [Order block or FVG zone]
Fibonacci: [Key retracement levels, 0.618-0.65 entry zone]

### Wyckoff Phase
Primary TF: [Phase A/B/C/D/E]
Rationale: [Volume pattern, spring, etc.]

### VSA Bar Reading
Recent bars: [Dominant VSA signatures]

### Order Flow
DOM: [Bid/Ask ratio, wall detection]
Imbalance: [Direction + magnitude]

### Confluence: [X/11]
[Table of 11 factors with Y/N]

### Trade Decision
Direction: [Long / Short / No Trade]
Conviction: [Full / Normal / Half / Quarter / None]
Entry: [Level + trigger]
Stop: [Level]
Targets: [TP1, TP2, TP3]
R:R: [X:Y]
```

---

## QuantMirror V4 Execution Flow

### Pre-Trade Checklist

```
[ ] 1. Fetch OHLCV across all timeframes
[ ] 2. Calculate objective features (SMC, volume, momentum)
[ ] 3. Score confluence (11-point checklist)
[ ] 4. Validate risk (R:R >= 2)
[ ] 5. Generate trade decision
```

### Post-Trade

```
[ ] Journal result (entry, exit, R:R, confluence score)
[ ] Review performance weekly
```

---

## Cleanup

After report delivery:
- Leave key drawings (trendlines, levels, zones) on the chart
- Only call `draw_clear` if the user explicitly asks for it
- Remove excess/pine drawings that clutter the chart
- Leave indicators on the chart for next analysis

## Quick Reference — MCP Tool Map

| Analysis Step | MCP Tool | Notes |
|-------------|----------|-------|
| Current state | `chart_get_state()` | Symbol, TF, entity IDs |
| Real-time price | `quote_get()` | Last, OHLC, volume |
| Switch timeframe | `chart_set_timeframe(tf)` | 1, 5, 15, 60, 240, D, W |
| Price bars | `data_get_ohlcv(count=100, [summary])` | Default count=100 |
| Indicator values | `data_get_study_values()` | RSI, VWAP, etc. |
| Add indicator | `chart_manage_indicator(action="add", indicator="Full Name")` | Use full names |
| Pine levels | `data_get_pine_lines(study_filter="name")` | Levels from custom indicators |
| Pine labels | `data_get_pine_labels(study_filter="name")` | Labeled levels with context |
| Order book | `depth_get()` | DOM snapshot (bids, asks, sizes) |
| Screenshot | `capture_screenshot(region="chart")` | Visual confirmation |
| Draw levels | `draw_shape(shape="horizontal_line", point={time, price})` | Mark S/L, entries, targets |
| Clear drawings | `draw_clear()` | Only if user requests |
