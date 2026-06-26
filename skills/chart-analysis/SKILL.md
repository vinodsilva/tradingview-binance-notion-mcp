---
name: chart-analysis
description: Legendary trader analytical engine — asymmetry-first, risk-driven, regime-adaptive. Built on principles from Livermore, Tudor Jones, Druckenmiller, Seykota, Minervini, and the Turtles. Use for sniper entries, pyramiding, and institutional-grade trade management.
---

# Legendary Trader Analytical Engine

Core philosophy: **Asymmetry > Direction. Exits > Entries. Position Sizing > Signal.**

---

## Step 0: Regime Detection (Seykota's First Law)

Before any analysis, classify the market. Different regimes get different playbooks.

### Trend Classification
Use `data_get_ohlcv` with `summary: true` across multiple timeframes.

| Regime | Signature | Playbook |
|--------|-----------|----------|
| Trending | Price > 50EMA on HTF + higher highs/lows | Trend-following. Pyramiding. Wide stops. |
| Ranging | Price oscillating between clear levels | Mean-reversion. Short R:R. Tight stops. |
| Volatile | ATR expansion > 20% of average | Reduce size. Wider stops. Wait for compression. |

**The rule** (Seykota / Turtles): In strong trends, size up. In choppy ranges, size down or sit out.

### ATR Volatility Read
- Pull `quote_get` for current price
- Calculate: `position_size = account_risk / (ATR × leverage)` — determines everything downstream
- If ATR > recent average by 30%+: **REDUCE SIZE BY HALF** (Larry Hite's rule)

---

## Step 1: The Asymmetry Scan (Tudor Jones)

**"I don't care about direction. I care about asymmetry."** — Paul Tudor Jones

Do NOT decide long/short first. Start with the R:R opportunity.

### Find the Pivots

Switch through timeframes in this order:

`Weekly → Daily → 4H → 1H → 15m`

At each timeframe, identify:

1. **Nearest major support** (where price would bounce)
2. **Nearest major resistance** (where price would reverse)
3. **Current price** relative to both

### Calculate Raw Asymmetry

```
Distance to nearest support = (price - support) / price × 100
Distance to nearest resistance = (resistance - price) / price × 100

If resistance distance ÷ support distance >= 3:
  → The setup exists. Now determine direction.

If < 3:
  → Not enough asymmetry. Move to next symbol or wait.
```

**Hard rule**: No trade without 3:1 asymmetry. This is non-negotiable.

### Apply Druckenmiller's Filter

**"The key is to wait for the fat pitch. Then swing hard."** — Stanley Druckenmiller

Only proceed if:
- HTF (Weekly/Daily) trend aligns with the asym direction — OR —
- There's clear HTF liquidity to be taken (making it a reversal play)

If neither condition is met → **PASS**. Druckenmiller waits weeks for his setups.

---

## Step 2: Market Structure & Confluence Toolkit

Apply each filter. Every "yes" adds conviction. Every "no" reduces size. Minimum 4/6 checks must pass to trade.

### Turtle Trend Filter
- `chart_manage_indicator` — add "Moving Average Exponential" (50, 200)
- Is price above both EMAs? → bullish bias
- Is price below both EMAs? → bearish bias
- Is price between them? → no clear trend — reduce size or pass

### Volume Analysis (Wyckoff / VSA)
- `chart_manage_indicator` — add "Volume", "VWAP"
- Breakout with volume > 20MA of volume → confirmed move
- Breakout with volume below average → suspect. Do not enter.
- Price above VWAP → bullish intraday context
- Price below VWAP → bearish intraday context
- Volume climax: look for the highest volume bar in the move — this often marks exhaustion, not continuation
- Absorption: wide-range bars that fail to follow through = absorption. Reversal likely.
- Volume divergence: price making new highs/lows but volume declining → move is losing conviction

### Livermore Pivot Check
**"Markets are never wrong. Opinions often are."** — Jesse Livermore

- Is price making higher highs AND higher lows on the execution timeframe? → bullish structure
- Is price making lower highs AND lower lows? → bearish structure
- Has price broken a significant pivot? → BOS confirmed — increased conviction
- Is price coiling (contracting range)? → explosive setup pending — monitor

### Chart Pattern Recognition
Use `capture_screenshot` and visually identify. Patterns are confluence — never trade patterns alone.

| Pattern | Bias | Execution |
|---------|------|-----------|
| Head & Shoulders | Bearish reversal | Entry on neckline break. Target = height of head |
| Inverse H&S | Bullish reversal | Entry on neckline break. Target = height of head |
| Ascending Triangle | Bullish continuation | Entry on resistance break. Target = height of triangle |
| Descending Triangle | Bearish continuation | Entry on support break. Target = height of triangle |
| Symmetrical Triangle | Breakout (direction of prior trend) | Entry on break with volume. Target = height at widest |
| Bull Flag / Pennant | Bullish continuation | Entry on flag breakout. Target = prior move's height |
| Bear Flag / Pennant | Bearish continuation | Entry on flag breakout. Target = prior move's height |
| Double Top | Bearish reversal | Entry on neckline break. Target = height of pattern |
| Double Bottom | Bullish reversal | Entry on neckline break. Target = height of pattern |
| Rising Wedge | Bearish reversal | Entry on breakdown. Watch for volume confirmation |
| Falling Wedge | Bullish reversal | Entry on breakout. Watch for volume confirmation |

**Key rule**: All pattern breakouts MUST have volume confirmation. No volume = no trade.

### Fibonacci Confluence
- `chart_manage_indicator` — add "Fibonacci Retracement" or use `draw_shape` to draw manually
- Apply Fib retracement to the most recent **significant swing** (high to low for long entries, low to high for short entries)

| Level | Use |
|-------|-----|
| 0.618 (Golden Zone) | Highest-probability retracement entry. Confluence with EMA/OB = strongest setup |
| 0.5 | Secondary retracement level. Moderate confluence |
| 0.786 | Deep retracement. Often fills FVGs. Trend is weak here — reduce size |
| 1.272 / 1.414 (Extensions) | TP targets for runners. Confluence with prior structure = high-probability target |
| 1.618 | Major extension target. Often marks end of impulse wave |

**Best setups**: When Fib 0.618 aligns with an order block, VWAP, or EMA — this is high-conviction confluence.

### RSI + Hidden Divergence
`chart_manage_indicator` — add "Relative Strength Index" (standard 14 period)

#### RSI Regime
| RSI Level | Read |
|-----------|------|
| > 70 | Overbought. Caution on longs. Watch for bearish divergence |
| 50–70 | Bullish momentum. Trend is strong |
| 30–50 | Bearish momentum. Trend is weak |
| < 30 | Oversold. Caution on shorts. Watch for bullish divergence |

#### Hidden Divergence (Highest-Conviction Signal)
Hidden divergence signals **trend continuation** — the most powerful signal in divergence trading.

**Bullish Hidden Divergence** (trend continuation — long):
- Price: higher low (HL)
- RSI: lower low (LL)
- Interpretation: Pullback is weak in momentum terms. Trend will resume. **Aggressively size up.**

**Bearish Hidden Divergence** (trend continuation — short):
- Price: lower high (LH)
- RSI: higher high (HH)
- Interpretation: Rally is weak. Downtrend resumes. **Aggressively size up.**

#### Regular Divergence (Reversal Signal)
**Bullish Regular Divergence** (reversal — long):
- Price: lower low (LL)
- RSI: higher low (HL)
- Interpretation: Momentum says selling is exhausted. Trend reversal incoming.

**Bearish Regular Divergence** (reversal — short):
- Price: higher high (HH)
- RSI: lower high (LH)
- Interpretation: Momentum says buying is exhausted. Trend reversal incoming.

**Size rule**: Hidden divergence → size up (continuation). Regular divergence → normal size (reversal is lower probability).

### Supply & Demand Zones
Draw explicit supply and demand zones — these are the foundational levels for your entire trade plan.

**Demand Zone (support):**
- Look for the last down-close bar before a strong up-move
- The zone covers: the lowest point of that up-move start bar → the midpoint of the adjacent bar
- Price returning here = high-probability bounce zone
- Mark with `draw_shape` rectangle: green zone, label "D"

**Supply Zone (resistance):**
- Look for the last up-close bar before a strong down-move
- The zone covers: the highest point of that down-move start bar → the midpoint of the adjacent bar
- Price returning here = high-probability rejection zone
- Mark with `draw_shape` rectangle: red zone, label "S"

**Freshness rule**: The first touch of a supply/demand zone has the highest probability. Each subsequent touch weakens the zone by ~30%.

### Minervini VCP (Volatility Contraction)
- `data_get_ohlcv` with `count: 20` — compare range of last 10 bars vs the 10 before
- If range is contracting on declining volume → **Volatility Contraction Pattern**
- This is the highest-conviction setup type. Size up.
- VCP + hidden divergence + Fib 0.618 retracement + demand zone = **the sniper entry**

---

## Step 3: Risk-First Position Sizing (Kelly / Hite)

**"Position sizing is the only thing that matters. You can have the best entry in the world and still blow up if your sizing is wrong."** — Larry Hite

### Calculate Before Entry

```
ATR = Average True Range (from data or estimate)
Account risk = Account × Risk% (0.5-1.5% per trade)

# Kelly Optimal Fraction (standard formula)
Kelly % = WinRate - ((1 - WinRate) × AvgLoss ÷ AvgWin)
  → Cap at 25% of account for any single position
  → Default to 0.5× Kelly for safety (Half-Kelly)

# ATR-Based Position Size
Position size (units) = Account Risk / (ATR × stop_multiple)
Leverage = Position Value / Account Equity
```

### Leverage Calibration
| Asset Volatility | Max Leverage | Stop Multiple |
|-----------------|--------------|---------------|
| Low (ATR < 1%) | 5× | 2× ATR |
| Medium (ATR 1-3%) | 3× | 2× ATR |
| High (ATR 3-5%) | 2× | 1.5× ATR |
| Extreme (ATR > 5%) | 1× or pass | 1× ATR |

**Hard rule**: Never exceed 3× leverage unless running a multi-leg hedge.

---

## Step 4: Entry Trigger — Mechanical Execution (Turtle Rules)

**"The trend is your friend until the end."** — Turtle Trading Rule

Switch to the **entry timeframe** (15m or 5m). Enter only when ALL conditions below are met:

### Long Entry Checklist
- [ ] HTF trend is bullish OR asymmetry is 3:1+ for a reversal
- [ ] Price just swept sell-side liquidity (below a recent low) AND reversed
- [ ] At least one bullish volume bar (close > open × 1.5× avg vol)
- [ ] Price is at or above VWAP on entry timeframe
- [ ] RSI on 15m is not above 80 (not overbought on entry TF)
- [ ] You know your exact invalidation level (see Step 5)

### Short Entry Checklist
- [ ] HTF trend is bearish OR asymmetry is 3:1+ for a reversal
- [ ] Price just swept buy-side liquidity (above a recent high) AND rejected
- [ ] At least one bearish volume bar (close < open × 1.5× avg vol)
- [ ] Price is at or below VWAP on entry timeframe
- [ ] RSI on 15m is not below 20 (not oversold on entry TF)
- [ ] You know your exact invalidation level (see Step 5)

**Turtle rule**: If all conditions are met, enter without hesitation. If any are missing, pass.

### Entry Execution
- Enter at market or on limit at the retest of the breakout level
- Never chase a move more than 0.5× ATR from the trigger point
- If you missed it: **wait for the next pullback**. There is always another trade.

---

## Step 5: Trade Management — Pyramiding & Exits

### Initial Stop (Risk First)

Place stop at the nearest structural invalidation point:
- For longs: below the recent sweep low or the last swing low — whichever is nearer
- For shorts: above the recent sweep high or the last swing high — whichever is nearer
- If ATR stop distance > structural distance, use structural distance

**Max loss**: Confirm the $ value loss before entering. If it exceeds your account risk budget, reduce size. Never widen your stop to fit a position size.

### Pyramiding (Livermore / Druckenmiller)

**"Never average down. Only add to winners."** — Jesse Livermore

| Condition | Action |
|-----------|--------|
| Price moves +1R in your favor | Scale in 50% additional size |
| Price moves +2R in your favor | Scale in 25% additional size |
| Price moves +3R in your favor | No more adds. Let runner breathe. |

Each add uses a **tighter stop** (the previous entry level or 1× ATR, whichever is tighter).

**Never add if price has NOT moved in your favor.** This is the single most important rule.

### Partial Profit Taking

| Level | Action |
|-------|--------|
| +1R | Sell 25% → move stop to breakeven (Minervini rule) |
| +2R | Sell 25% → trail stop by 1 ATR |
| +3R | Sell 25% → trail stop by 1.5 ATR |
| Runner | Hold with trailing stop. Last 25% rides for the big move. |

### Trailing Stop Methodology

Once in profit:
1. Trail stop at the previous swing low/high (structure-based)
2. Never loosen the stop — only tighten
3. If price gaps through your stop, accept it and move on (Turtle rule: "No regrets")

### Time Stop (Seykota)

- If price hasn't moved 0.5× ATR in your favor within 5 bars on the entry timeframe → **exit**
- The setup is invalid. Something is wrong. Get out and reassess.

---

## Step 6: Annotate & Capture

### Chart Annotations

Use `draw_shape` to mark:

**Mandatory labels every trade must have:**
- Entry level → "Entry" with arrow
- Stop level → "SL" with red line
- TP1 → "+1R" with green line
- TP2 → "+2R" with green line

**Structural annotations:**
- BOS / MSS → label at breakout point
- Sweep → label where liquidity was taken
- Hidden Divergence → draw trendlines on price + RSI; label "HIDDEN BULL" or "HIDDEN BEAR"
- Regular Divergence → label "REG DIV" on both price and RSI
- Supply Zone → red rectangle, label "S"
- Demand Zone → green rectangle, label "D"
- Order Block → blue rectangle, label "OB"
- Fair Value Gap → label "FVG" between the gap candles
- Fibonacci → draw 0.618, 0.5, 0.786 levels; label "Fib 0.618" at the golden zone
- Pattern → label the pattern name at formation ("H&S", "Bull Flag", "Triangle")

### Drawing Long Position Visually

Use these `draw_shape` calls to mark a complete long setup. All coordinates use the current bar's unix timestamp from `quote_get`.

```
# 1. Entry arrow + label
draw_shape(shape="text",
  point={time: [current_timestamp], price: [entry_price]},
  text="🟢 LONG $X.XXXX",
  overrides='{"color": "#00ff00", "fontsize": 14}')

# 2. Entry line
draw_shape(shape="horizontal_line",
  point={time: [current_timestamp], price: [entry_price]},
  overrides='{"linecolor": "#00ff00", "linewidth": 2}')

# 3. Stop loss line + label (RED)
draw_shape(shape="horizontal_line",
  point={time: [current_timestamp], price: [stop_price]},
  overrides='{"linecolor": "#ff0000", "linewidth": 2}')
draw_shape(shape="text",
  point={time: [current_timestamp], price: [stop_price - 0.5%]},
  text="SL $X.XXXX",
  overrides='{"color": "#ff0000"}')

# 4. TP1 line + label (GREEN, dashed)
draw_shape(shape="horizontal_line",
  point={time: [current_timestamp], price: [tp1_price]},
  overrides='{"linecolor": "#00ff00", "linewidth": 1, "linestyle": 2}')
draw_shape(shape="text",
  point={time: [current_timestamp], price: [tp1_price + 0.3%]},
  text="TP1 +1R $X.XXXX",
  overrides='{"color": "#00ff00"}')

# 5. TP2 line + label (GREEN, dashed)
draw_shape(shape="horizontal_line",
  point={time: [current_timestamp], price: [tp2_price]},
  overrides='{"linecolor": "#00ff00", "linewidth": 1, "linestyle": 2}')
draw_shape(shape="text",
  point={time: [current_timestamp], price: [tp2_price + 0.3%]},
  text="TP2 +2R $X.XXXX",
  overrides='{"color": "#00ff00"}')
```

**Color scheme**: Green = profit zone, Red = loss zone.

### Drawing Short Position Visually

Use these `draw_shape` calls to mark a complete short setup.

```
# 1. Entry arrow + label
draw_shape(shape="text",
  point={time: [current_timestamp], price: [entry_price]},
  text="🔴 SHORT $X.XXXX",
  overrides='{"color": "#ff0000", "fontsize": 14}')

# 2. Entry line (RED)
draw_shape(shape="horizontal_line",
  point={time: [current_timestamp], price: [entry_price]},
  overrides='{"linecolor": "#ff0000", "linewidth": 2}')

# 3. Stop loss line + label (RED, dashed — loss zone is ABOVE entry for shorts)
draw_shape(shape="horizontal_line",
  point={time: [current_timestamp], price: [stop_price]},
  overrides='{"linecolor": "#ff0000", "linewidth": 2}')
draw_shape(shape="text",
  point={time: [current_timestamp], price: [stop_price + 0.5%]},
  text="SL $X.XXXX",
  overrides='{"color": "#ff0000"}')

# 4. TP1 line + label (GREEN, dashed — profit zone is BELOW entry for shorts)
draw_shape(shape="horizontal_line",
  point={time: [current_timestamp], price: [tp1_price]},
  overrides='{"linecolor": "#00ff00", "linewidth": 1, "linestyle": 2}')
draw_shape(shape="text",
  point={time: [current_timestamp], price: [tp1_price - 0.3%]},
  text="TP1 +1R $X.XXXX",
  overrides='{"color": "#00ff00"}')

# 5. TP2 line + label (GREEN, dashed)
draw_shape(shape="horizontal_line",
  point={time: [current_timestamp], price: [tp2_price]},
  overrides='{"linecolor": "#00ff00", "linewidth": 1, "linestyle": 2}')
draw_shape(shape="text",
  point={time: [current_timestamp], price: [tp2_price - 0.3%]},
  text="TP2 +2R $X.XXXX",
  overrides='{"color": "#00ff00"}')
```

**Color scheme**: Red = entry and loss zone (ABOVE), Green = profit zone (BELOW).

### Quick Reference — Entry/Stop/TP Object

For fast annotation, construct and draw this universally:

```json
// LONG template
{ "entry": 1.2350, "stop": 1.2250, "tp1": 1.2600, "tp2": 1.2800, "ts": 1781539200 }

// SHORT template
{ "entry": 1.2700, "stop": 1.2800, "tp1": 1.2500, "tp2": 1.2350, "ts": 1781539200 }
```

Draw all 5 elements in sequence: entry line + label, stop line + label, tp1 line + label, tp2 line + label, direction arrow.

### Capture
- `capture_screenshot` with region "chart" — the annotated trade plan
- `capture_screenshot` with region "full" — if you want the full context

---

## Step 7: Edge Tracking (Simons / Renaissance)

After every trade, log:

```
Setup Type:           [Trend Follow / VCP / Reversal / Range]
Win/Loss:             [W / L]
R:R Realized:         [X.X]
Execution Quality:    [Good / Slippage / Missed]
Entry TF Conviction:  [1-5]
Notes:                [What went right/wrong]
```

**Update edge calculation** every 30 days:
```
Edge = (Avg Win_R × WinRate) - (Avg Loss_R × LossRate)
```

If edge > 0.3 → continue with confidence
If edge < 0.1 → reassess the setup criteria
If edge < 0 → stop trading this setup entirely

---

## Step 8: Report Format — Legendary Trader Decision Log

### Regime
Trending / Ranging / Volatile — ATR: [X]

### Asymmetry
Distance to S/L: [X%] / Distance to T/P: [X%]
Raw R:R: [X:1] — Greenlit? [Yes/No]

### Confluence Checklist
| Signal | Pass? |
|--------|-------|
| HTF Trend aligned | Y/N |
| Volume confirms breakout | Y/N |
| Structure (BOS/MSS) confirms | Y/N |
| Chart pattern present | Y/N — [Name pattern] |
| Fib 0.618 lines up with entry | Y/N |
| RSI + Hidden Divergence | Y/N — [Hidden/Regular/Bull/Bear/None] |
| Supply/Demand zone at entry | Y/N — [Zone type] |
| VCP / compression | Y/N |
| Liquidity swept | Y/N |
| R:R ≥ 3:1 | Y/N |

**Total Conviction**: [X/10] — Minimum 7/10 to trade

### Trade Plan
```
Direction:        Long / Short
Entry:            [Price / conditions]
Invalidation:     [Price — must be structural]
Position Size:    [X units — ATR × Kelly calculated]
Leverage:         [X×]
Stop Distance:    [X ATR / $X]
TP1 (+1R):        [Price]
TP2 (+2R):        [Price]
Runner Target:    [Price / structural target]
Account Risk:     [X% of account]
```

### Legendary Quote for This Trade
*Example: "The trend is your friend until the end." — Turtle Rule*

### Confidence Score with Rationale
**X/10** — [One-sentence rationale citing the strongest confluence factor]

---

## Cleanup

After the report is delivered:
- `draw_clear` — remove all temporary drawings unless user wants them kept
- Leave indicators on the chart unless user asks to remove them
