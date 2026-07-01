---
name: decision-engine
description: Confluence scoring, trade grading, risk management, reporting template, execution flow
---

# Decision Engine — Confluence, Risk & Execution

## Multi-Timeframe Confluence Matrix

### 7-Factor Confluence (QuantMirror Internal)

| # | Factor | Test |
|---|--------|------|
| 1. | Volume Trend | HTF volume supports direction |
| 2. | Wyckoff Phase | Phase supports trade direction |
| 3. | VSA Confirmation | Bars consistent with thesis |
| 4. | Elliott Wave | All 4 rules met, position supports direction |
| 5. | Divergence | Hidden on LTF aligned with HTF, or regular for reversal |
| 6. | Structure | Clear BOS/MSS on execution TF with volume |
| 7. | Key Level Confluence | Entry at spring, OB, FVG, or Fib 0.618 |
| 8. | Order Flow | DOM alignment, VSA absorption, no conflicting signals |

### QuantMirror V4 10-Point Confluence (Full)

| # | Factor | What It Tests | Y/N |
|---|--------|---------------|-----|
| 1. | Trend alignment | HTF direction matches trade direction | |
| 2. | BOS / CHOCH confirmation | Structure break in trade direction with volume | |
| 3. | Sweep direction matches trade | A/B-grade sweep/inducement direction supports trade | |
| 4. | Order Block / FVG interaction | Price at OB/FVG that supports trade direction | |
| 5. | Fibonacci confluence | Retracement at 0.382-0.65 in trade direction | |
| 6. | Volume confirmation | Bar at key level has volume > 1.5x avg | |
| 7. | Wyckoff phase support | Phase aligns with trade direction | |
| 8. | Momentum confirmation | RSI supports trade (oversold in uptrend, overbought in downtrend) | |
| 9. | VSA / Order flow alignment | Recent VSA bars consistent with thesis | |
| 10. | DOM directional bias | Bid/ask ratio supports direction (if available) | |
| 11. | Risk management validation | R:R >= 2, ATR check, stop structurally placed | |

**Score: X/11 | Reject if < 8/11**

**IMPORTANT: Sweep (#3) is DIRECTIONAL.** Sell-side sweep (low taken out, close back above) → scores Y only for LONG. Buy-side sweep (high taken out, close back below) → scores Y only for SHORT. C-grade sweep → scores N regardless.

### Conviction Sizing

```
8/8 internal or 11/11 full → Full size. Sniper entry.
7/8 or 9-10/11 → Normal size (0.75x)
6/8 or 8/11 → Half size (0.5x)
5/8 or <8/11 → Quarter size or pass
Below → NO TRADE
```

---

## Risk Framework

### Stop Placement Rules

| Condition | Stop Level |
|-----------|-----------|
| Wyckoff Spring entry | Below spring wick low minus ATR/2 |
| Hidden divergence long | Below the higher low forming divergence |
| Elliott Wave 4 entry | Below Wave 1 high |
| Regular divergence long | Below the lower low (divergence origin) |
| VSA absorption long | Below the absorption bar low |
| Order Block entry | Below/above OB range by ATR/4 |

### Risk Rules (QuantMirror V4)

- Max account risk per trade: 0.5-1%
- Max portfolio exposure: 3%
- Structural stop-loss (not dollar-based)
- ATR validation
- No trade if confluence < 8/11 or R:R < 2

### Absolute No-Trade Rules (Override All Analysis)

These override every confluence score. If ANY is true, reject the trade.

| Rule | Condition |
|------|-----------|
| No shorting parabolic | LOW_CAP_PARABOLIC regime active. W RSI > 85 + rising volume + price above W EMA 50. |
| No shorting at ATH | Price above all-time high. No resistance above. Only long until W + D CHOCH. |
| No buying at ATL | Price below all-time low. No support below. Only short until W + D CHOCH. |
| No trading no-man's land | Price between two key levels (swing high/low) with no sweep or inducement of either. |
| No trading news events | Within 30 min of FOMC, CPI, NFP, earnings, or major protocol upgrades. |
| No trading all-balance | W + D + 4H all show Range/Balance. No directional edge on any core TF. |
| No second TF fade without first TF sweep | Do not fade a breakout on 15M if 60M is still showing strong continuation. Wait for 60M sweep first. |

### Trend Position Classification

Trends have phases. A sweep at the extreme of a trend is fundamentally different from a sweep mid-trend. Classify trend position before scoring any trade:

| Position | Definition | Sweep Reliability | Action |
|----------|------------|-------------------|--------|
| **Early** | Trend just began (1-2 BOS/CHOCH from range break). Still tight to range origin. | **MEDIUM** — sweep is part of early consolidation. Expect multiple sweeps. | Trade direction with 0.5x size. Add on 2nd BOS. |
| **Mid** | Trend established (3+ BOS). Price in middle 50% of total trend range. Pullbacks are normal. | **LOW** — sweep mid-trend is likely a shakeout before continuation. | Trade direction with full size. Fade counter-trend sweeps at 0.25x only. |
| **Late/Extreme** | Price at or near prior HTF swing point. 2+ sweeps already occurred. RSI extended. | **HIGH** — sweep at extreme = climax. Highest probability reversal setup. | Anticipate reversal. Fade the trend. Grade A sweep + late trend = sniper entry. |

**How to determine:**
```python
total_trend_range = high_swing - low_swing  # Since trend started
current_position = (current_price - low_swing) / total_trend_range  # 0-1
bos_count = count_bos_since_trend_start()

if bos_count <= 2:
    position = "EARLY"
elif bos_count >= 3 and 0.25 < current_position < 0.75:
    position = "MID"
elif current_position > 0.85 or current_position < 0.15:
    position = "LATE"
```

**BTCUSDT example:**
- Trend from 74K→58K (4H downtrend). Total range: 16K.
- Price at 58K → current_position = (58K-58K)/(74K-58K) = 0.0 → LATE
- Sweep at LATE position + Grade A = high probability reversal setup
- But counter to W/D HTF trend → contrarian rules apply (see below)

### Contrarian Sweep Rules

When a sweep direction OPPOSES the HTF trend direction (e.g., bullish sweep in bearish W/D/4H), apply these rules:

| Condition | Action |
|-----------|--------|
| Sweep Grade A + counter to HTF trend | Tradeable at 0.5x size. Must have 60M BOS confirmation after sweep. Stop beyond sweep wick. |
| Sweep Grade B + counter to HTF trend | NO TRADE. Wait for HTF trend to at least neutralize (1 TF shows CHOCH) before trading the counter-trend sweep. |
| Sweep Grade C + counter to HTF trend | Skip entirely. A C-grade sweep is noise, fighting the trend is suicide. |
| Sweep Grade A/B + aligned with HTF trend | Full size. Add on pullback. The trend and sweep confirm each other. |
| Multiple sweeps same level (2+) counter to HTF | Higher probability — liquidity is stacked. Can trade Grade B at 0.5x with 60M confirmation. |

**Golden rule:** Never enter contrarian before 60M confirms. The sweep bar itself is the signal. The 60M BOS after it is the confirmation. If 60M does not make BOS within 3 bars, the contrarian trade is invalid.

### ATR-Based Position Sizing

```python
atr = data_get_study_values()["ATR"]  # From current timeframe
entry = target_entry_price
stop = stop_price
risk_per_unit = abs(entry - stop)
units = (account_risk_pct * account_value) / risk_per_unit
```

---

## Reporting

### QuantMirror V4 Report Template

```
### QuantMirror V4 Score: X/10

### Multi-Timeframe Volume Profile
W: [Volume trend]
D: [Volume trend]
60: [Volume trend]
15: [Volume trend]
5: [Volume trend]

### SMC Structure Analysis
Market Structure: [Bullish/Bearish/Neutral]
MSS/BOS: [Detected direction + confirmation]
Liquidity: [Sweep detected at level — Bullish/Bearish]
OB/FVG: [Order block or FVG zone]
Fibonacci: [Key retracement levels, 0.618-0.65 entry zone]

### Wyckoff Phase
Primary TF: [Phase A/B/C/D/E]
Rationale: [Volume pattern, spring, etc.]

### Elliott Wave Count
Primary TF: [Wave X of Impulse/Correction]
Rules: [Y/Y/Y/Y]

### Divergence Matrix
| TF | Type | Volume | Conviction |
|----|------|--------|------------|
| W | Regular/Hidden/None | Trend | X/10 |
| D | Regular/Hidden/None | Trend | X/10 |
| 60 | Regular/Hidden/None | Trend | X/10 |
| 15 | Regular/Hidden/None | Trend | X/10 |
| 5 | Regular/Hidden/None | Trend | X/10 |

### VSA Bar Reading
Recent bars: [List dominant VSA signatures]

### Order Flow
DOM: [Bid/Ask ratio, wall detection, absorption]
Delta: [Positive/Negative/Neutral — trend across bars]
Imbalance: [Direction + magnitude]

### Confluence: [X/11]
| Factor | Pass? |
|--------|-------|
| 1. Trend alignment | Y/N |
| 2. BOS/CHOCH confirmation | Y/N |
| 3. Sweep direction matches | Y/N |
| 4. OB/FVG interaction | Y/N |
| 5. Fibonacci confluence | Y/N |
| 6. Volume confirmation | Y/N |
| 7. Wyckoff phase support | Y/N |
| 8. Momentum confirmation | Y/N |
| 9. VSA/Order flow alignment | Y/N |
| 10. DOM directional bias | Y/N |
| 11. Risk validation (R:R>=2) | Y/N |

### Trade Decision
Direction: [Long / Short / No Trade]
Weighted Score: [% — from decision model]
Conviction: [Full / Normal / Half / Quarter / None]
Entry: [Level + trigger]
Stop: [Level — rule reference]
Targets: [TP1, TP2, TP3]
R:R: [X:Y]

### Entry Triggers
[What must happen for this trade to activate — specific price, pattern, or volume condition]
[Example: "Wait for 60M BOS above 59,000. Entry on retest of 58,800 with volume <0.7x avg"]
[Example: "Entry already triggered — sweep bar low = stop, current close = entry"]

### Contrarian Sweep Note (if applicable)
[Only filled when sweep is counter to HTF trend]
[Example: "Sweep is counter to W/D/4H bearish trend. Grade A → tradeable at 0.5x with 60M confirmation. No short until W shows CHOCH."]
```

---

## QuantMirror V4 Execution Flow

### Pre-Trade Checklist

```
[ ] 1. Fetch OHLCV across all timeframes
[ ] 2. Calculate objective features (SMC, volume, momentum)
[ ] 3. AI contextual analysis (Wyckoff, VSA, order flow, sentiment)
[ ] 4. Score confluence (11-point checklist)
[ ] 5. Validate risk (R:R >= 2, ATR check)
[ ] 6. Generate trade decision
```

### Post-Trade

```
[ ] Journal result (entry, exit, R:R, confluence score)
[ ] Review performance weekly
[ ] Optimize based on backtesting, not intuition
```

---

## Cleanup

After report delivery:
- Leave key drawings (trendlines, levels, zones) on the chart — they provide visual context
- Only call `draw_clear` if the user explicitly asks for it
- Remove excess/pine drawings that clutter the chart
- Leave indicators on the chart for next analysis

## Quick Reference — MCP Tool Map

| Analysis Step | MCP Tool | Notes |
|-------------|----------|-------|
| Current state | `chart_get_state()` | Symbol, TF, entity IDs |
| Real-time price | `quote_get()` | Last, OHLC, volume |
| Switch timeframe | `chart_set_timeframe(tf)` | 1, 5, 15, 60, 240, D, W |
| Price bars | `data_get_ohlcv(count, [summary])` | Always use count=200 |
| Indicator values | `data_get_study_values()` | RSI, VWAP, ATR, etc. |
| Add indicator | `chart_manage_indicator(action="add", indicator="Full Name")` | Use full names |
| Pine levels | `data_get_pine_lines(study_filter="name")` | Levels from custom indicators |
| Pine labels | `data_get_pine_labels(study_filter="name")` | Labeled levels with context |
| Order book | `depth_get()` | DOM snapshot (bids, asks, sizes) |
| Screenshot | `capture_screenshot(region="chart")` | Visual confirmation |
| Draw levels | `draw_shape(shape="horizontal_line", point={time, price})` | Mark S/L, entries, targets |
| Clear drawings | `draw_clear()` | Only if user requests |
