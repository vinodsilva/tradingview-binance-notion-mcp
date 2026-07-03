---
name: _structure
description: SMC structure — BOS/CHoCH, order blocks, FVGs, liquidity, Wyckoff phases, PD arrays, displacement
---

# Structure — SMC & Market Geometry

## Dependencies
- `_setup` → OHLCV data per TF
- `_volume` → stop hunts and dominant signature for confirmation

## Steps

### 1. Read Structure from Pine Labels
Use `data_get_pine_labels(study_filter="Mxwll")` to read structural labels.

| Label | Meaning |
|-------|---------|
| HH / LH | Higher high / Lower high (swing highs) |
| HL / LL | Higher low / Lower low (swing lows) |
| BoS / I-BoS | Break of structure / Internal BOS |
| CHoCH / I-CHoCH | Change of character / Internal CHoCH |

**Building the structure sequence:**
- **Uptrend:** HH + HL sequence, BoS to the upside. Each HH is above the last, each HL is above the last.
- **Downtrend:** LH + LL sequence, BoS to the downside. Each LH is below the last, each LL is below the last.
- **Transition:** CHoCH labels appear. The last HH failed to make a new HH → LH formed. Or the last HL failed → LL formed.
- **Range:** HH+LH alternating, HL+LL alternating. No directional expansion.

**When pine labels are unavailable**, identify swing points from OHLCV:
- Look for 2-3 bar pivots (bar with higher high/lower low flanked by lower highs/higher lows)
- Connect swing highs and swing lows
- BOS = price breaks beyond the most recent swing point in the trend direction
- CHoCH = price breaks the most recent swing point against the trend direction

### 2. Identify Order Blocks

Order blocks are the last candle before a strong displacement (impulse move). They represent where institutions placed large orders.

**Types:**
| OB Type | Bullish | Bearish |
|---------|---------|---------|
| **Mitigation Block** | Last red candle before strong green impulse | Last green candle before strong red impulse |
| **Breaker Block** | Failed bearish OB that got reclaimed (bear trap) | Failed bullish OB that got reclaimed (bull trap) |
| **Reversal Block** | Forms at a CHoCH — first OB after character change | Forms at a CHoCH — first OB after character change |

**Key rules:**
- A valid OB must have a strong displacement following it (2x+ avg bar range or clear impulse)
- The OB zone = the full range of the candle (high to low)
- Some traders use only the body, some use the full wick. Full wick is safer.
- An OB that held as support/resistance multiple times is stronger than a fresh one

**States:**
- **Fresh** — price hasn't touched the zone
- **Mitigated** — price entered the zone (touched it)
- **Broken** — price closed beyond the opposite side of the OB
- **Inverted** — after mitigation, price reversed from the zone (now acts as the opposite)

**Confluence that strengthens an OB:**
- Aligns with HTF trend direction
- Has declining volume approaching it (absorption)
- Has fib level overlap (0.618 or 0.79)
- Multiple timeframe OBs stacked at same level

### 3. Identify FVGs (Fair Value Gaps)

An FVG is a triple-candle imbalance where adjacent candles don't overlap.

**Bullish FVG:** C1 high < C3 low — gap between C1's high and C3's low.
**Bearish FVG:** C1 low > C3 high — gap between C1's low and C3's high.

**Types:**
| Type | Description | Reliability |
|------|-------------|-------------|
| **Opening gap** | Gap from session open / overnight | Low (often fills fast) |
| **Runaway gap** | Gap mid-trend with strong volume | Medium (can become support/resistance) |
| **Exhaustion gap** | Gap at end of trend with climax volume | Low (end of move) |
| **Wick FVG** | Gap between opposing wicks only | Lower (less significant) |
| **Body FVG** | Gap between real bodies | Higher (stronger imbalance) |

**FVG behavior:**
- Price tends to return to fill FVGs (liquidity seeking balance)
- A partially filled FVG that holds = strong support/resistance
- A fully filled FVG = neutralized
- IFVG (inverted FVG) = an FVG that was filled, then the zone flipped polarity

**States:** Unfilled → Partial → Filled → Inverted

### 4. Assess Liquidity Pools

Liquidity = price levels where stop losses cluster. Institutions sweep these before reversing.

**Types of liquidity:**
| Type | What to Look For | Sweep Signal |
|------|------------------|-------------|
| **Equal highs** | Two or more swing highs at same price | Break above, then reversal |
| **Equal lows** | Two or more swing lows at same price | Break below, then reversal |
| **Trendline liquidity** | Multiple touches of a trendline | Wick through trendline |
| **Session highs/lows** | Asian/NY/London session extremes | Price wicks beyond then reclaims |
| **Weekly/monthly highs** | Previous week/month extreme | Common sweep targets |
| **OB edges** | Stop losses sit beyond OB boundaries | Wick beyond OB high/low |
| **FVG edges** | Stop losses sit beyond FVG boundaries | Wick beyond FVG high/low |

**Grade liquidity sweeps:**
- **A-grade:** Sweep of HTF level (weekly/daily) with clear reclaim → high probability reversal
- **B-grade:** Sweep of LTF level (hourly) with reclaim → moderate probability
- **C-grade:** Near-sweep (wick touches but doesn't breach) → watch only
- **D-grade:** No sweep, no reclaim → no edge

**Sweep + Reclaim** = bullish (price swept stop losses below, then recovered)
**Sweep + Reject** = bearish (price swept stop losses above, then rejected)
**Sweep + Fail** = sweep without reclaim → trend likely continues in sweep direction

### 5. Premium & Discount Zones (PD Arrays)

Markets spend time seeking inefficiency. The 50% level divides premium (expensive) from discount (cheap).

**Bullish framework:**
- Price below 50% = **discount** — institutional buying zone
- Entry at discount, target at premium (above 50%)
- Order blocks and FVGs in discount are higher probability

**Bearish framework:**
- Price above 50% = **premium** — institutional selling zone
- Entry at premium, target at discount (below 50%)
- Order blocks and FVGs in premium are higher probability

**Optimal Trade Entry (OTE):**
- 0.618-0.79 retracement zone of the most recent impulse
- Sit in discount (for longs) or premium (for shorts)
- Confluence with OB/FVG in this zone = highest probability entry

### 6. Fibonacci — Retracement, Extension & Clusters

Fibonacci levels act as natural support/resistance because market participants place orders at these common retracement and extension points.

**Drawing fib retracement:**
- Apply to the most recent major swing (clear HH→LL for bearish retrace, clear LL→HH for bullish retrace)
- Only use clean swings with 3+ bars between points — don't fib every small wiggle
- Key levels: 0.236 (weak), 0.382 (moderate), 0.5 (psychological), 0.618 (strong), 0.79 (deep)

**What each level means:**

| Level | Label | Behavior |
|-------|-------|----------|
| **0.236** | Shallow retrace | Trend so strong it barely pulls back. Momentum continuation. |
| **0.382** | Moderate retrace | Healthy trend pullback. Common Wave 4 retrace zone. |
| **0.5** | Psychological equilibrium | Common reversal zone. 50% = mean. Above is premium, below is discount. |
| **0.618** | Golden zone | Highest-probability reversal zone. Common Wave 2 retrace. OBE in discount. |
| **0.79** | Deep retrace | Trap zone. Sweeps beyond 0.618 to grab stops before reversing. Often counter-trend. |
| **1.0** | Full retrace | Trend invalidated. Back to start of the swing. |

**Drawing fib extension:**
- Apply same swing as retrace, but look for projection levels above 1.0
- Extensions measure where price is likely to go after the retrace completes
- Common targets: 1.272 (standard), 1.414 (strong), 1.618 (max typical)

| Extension | Behavior |
|-----------|----------|
| **1.272** | Most common Wave 3 / Wave C target. TP1 area. |
| **1.414** | Aggressive extension. If reached, Wave 3 is powerful. |
| **1.618** | Maximum typical extension. TP2 / runner target. Rarely exceeded. |

**Fib clusters — highest probability setups:**

A fib cluster = multiple fib levels from different swings converging at the same price zone. The more levels that converge, the stronger the zone.

**To identify clusters:**
- Draw fib retracement on the HTF swing (4H/D) → note key levels
- Draw fib retracement on the LTF swing (1H/15m) → note key levels
- Overlap = Where both point to the same price zone
- Grade the cluster by how many levels converge and their TF importance

**Cluster grading:**

| Grade | Convergence | Reliability |
|-------|-------------|-------------|
| **A** | 3+ levels across HTF+LTF + OB/FVG overlap | Highest — full size zone |
| **B** | 2 levels + OB or FVG at same zone | High — reduce size |
| **C** | Single level with no confluence | Low — wait for confirmation |
| **D** | No level near price | No fib edge |

**Practical fib rules:**
- Price reacts at fib levels, not on them. Stop at 0.618 is asking to be swept. Place stops 1 ATR beyond.
- HTF fib levels (D/W) always overpower LTF fib levels (15m/1H)
- A 0.618 + OB + declining vol = the highest probability entry in SMC
- Don't use fib on choppy / ranging markets — it only works in directional swings
- If 0.618 breaks cleanly with volume, the trend is failing (next test = 0.79, then 1.0)

### 7. Displacement & Confirmation

A structure level (OB, FVG, trendline) is only valid if followed by displacement.

**What counts as displacement:**
- Bar range > 1.5x average of preceding bars
- Volume > 1.5x average
- Close near the extreme (top for bullish, bottom for bearish)
- Clean break through a structure level (not a wick-through)

**No displacement = level is weak** — price may chop through it.

**Displacement + Retest = Entry Pattern:**
1. Strong impulse through a level (displacement)
2. Pullback to the level (retest)
3. Low-volume pullback (absorption)
4. Second impulse = entry trigger

### 8. Market Structure Shift (MSS)

A true shift is more than one bar against the trend. It's a structural break.

**Identifying a true shift vs pullback:**

| Characteristic | Pullback | Shift (MSS) |
|---------------|----------|-------------|
| Depth | Stays within previous swing point | Breaks previous swing point |
| Volume | Declining | Increasing on break |
| Bars | 1-3 bars, compact | Multiple bars, extended |
| Retrace | Returns to trend direction | Continues away |
| Time | Quick reversal back | Sustained pressure |

**MSS requires:**
1. Break of the last swing point against the trend
2. Volume confirmation on the break bar
3. Retest of the broken level (optional but increases probability)
4. Second leg in the new direction

### 9. Wyckoff Phase (Mental Model)

| Phase | Event | Visual Signature |
|-------|-------|-----------------|
| A | Exhaustion | Wide-range bars, climax volume, long wicks |
| B | Accumulation/Distribution | Range trading, absorption (VSA type 5), declining vol |
| C | Spring/Upthrust | Sweep of range low/high + immediate reclaim |
| D | Markup/Markdown | BOS with impulse volume, clear directional bars |
| E | Distribution completion | Failed HH/LL, CHoCH against trend |

Wyckoff is a framing model, not a trigger. Only actionable after Phase C (sweep + reclaim) confirmed with BOS in Phase D.

### 10. Multi-TF Structure Reading — W → D → 4H → 1H → 15m

Each timeframe plays a different role. Reading them in isolation creates noise. Reading them as a hierarchy reveals where price is in the broader cycle.

#### TF Role Assignment

| TF | Role | What It Tells You | Bar Count to Read |
|----|------|-------------------|-------------------|
| **W** | Direction bias | Macro trend (up/down/range). Which side to favor for the week. | 8-12 bars |
| **D** | Swing structure | Major swing points (HH/HL/LH/LL). PD array range. Key OB/FVG zones. | 20-30 bars |
| **4H** | Zone identification | Highest-probability OB/FVG zones. Liquidity sweeps. Wyckoff phase clarity. | 20-30 bars |
| **1H** | Trigger timeframe | Displacement + retest patterns. Entry zone precision. | 15-20 bars |
| **15m** | Execution | Clean structural OB for limit entry. Micro-displacement for market entry. | 10-15 bars |

#### The 3-TF Alignment Method

Read top-down, filter at each level:

**Step 1 — W: Set directional bias**
- W trending UP → only consider longs. Downtrend pullbacks on W = buy dips.
- W trending DOWN → only consider shorts. Uptrend bounces on W = sell rallies.
- W RANGE → counter-trend trades allowed but only from HTF zone with A-grade sweep.

**Step 2 — D: Identify swing structure**
- Where is price within the W range/trend?
- Mark D swing highs and lows — these are your primary HTF reference points.
- Is price in discount or premium on D? This determines your comfort zone.
- D OB/FVG zones = strong reaction zones. Price will respect these.

**Step 3 — 4H/1H: Pinpoint the zone**
- Look for 4H OB or FVG that sits in D discount (for longs) or D premium (for shorts).
- If the 4H zone has D-level overlap + fib cluster = A-grade zone.
- Drop to 1H to see if price is approaching the zone with declining volume (absorption).
- The 1H shows the displacement + retest pattern forming in real-time.

**Step 4 — 15m: Execute**
- Only when 15m shows an aligned structural entry (OB hold, FVG touch, sweep + reclaim).
- 15m displacement in the wrong direction = wait. Don't fight the micro-trend.
- If 15m entry triggers but 4H zone isn't reached → it's a LTF trade, not an HTF trade. Size accordingly.

#### Structure Confluence Across TFs

Reading the same concept on multiple TFs gives you confidence or warning:

| Concept | Aligned (high confidence) | Misaligned (reduce/wait) |
|---------|--------------------------|--------------------------|
| **Trend** | All TFs pointing same direction | W up, D up, 4H pulling back = healthy. W up, D ranging = weakening. |
| **OB** | Same price zone has D OB + 4H OB + 1H OB stacked | OBs at different levels — pick nearest to price, discount the rest |
| **FVG** | D FVG = 4H FVG = same gap | FVG on one TF but not the other = weaker structure |
| **Sweep** | W swept + D swept + 4H reclaim = A-grade | Only LTF swept (15m/1H) = B/C-grade, short-lived |
| **PD Array** | Price in D discount + 4H discount = buy zone | In D premium but 4H discount = mixed, wait for more alignment |
| **Wyckoff** | Same phase across D + 4H = clear model | D accumulating but 4H distributing = conflicting signals |

#### Handling Misalignment

| Scenario | Likely Meaning | Action |
|----------|---------------|--------|
| W UP, D UP, 4H pullback | Healthy correction in strong uptrend | Wait for 4H pullback to D discount OB → long |
| W UP, D DOWN, 4H DOWN | Deeper correction / potential W trend failure | Wait. Let D show CHoCH back up before entering. |
| W DOWN, D UP, 4H UP | Counter-trend rally in bear market | Short into D premium only. No longs. |
| W UP, D RANGE, 4H UP | W trending, D consolidating, 4H pushing up | Can trade 4H within D range, but expect D resistance above |
| W RANGE, D RANGE, 4H trending | Range-bound with internal moves | Trend-fade at range extremes. Don't expect breakout. |

#### Walkthrough Example

```
W: UP (consecutive green weeks, HH+HL)
D: UP, now pulling back from recent HH
4H: Price at D 0.618 fib + D discount zone + 4H bullish OB
1H: Low-volume drift into the OB, no large selling bars
15m: Swept below OB low (stop hunt), immediate green reclaim bar

→ Read: W bias LONG. D pullback to discount. 4H OB holding.
  1H absorption. 15m sweep + reclaim.
→ Verdict: LONG entry at 15m OB mitigation. SL below sweep low.
  TP1 at D 0.382, TP2 at D previous HH.
  Timing: market order on 15m reclaim close, or limit at 15m OB.
```

### 11. Elliott Wave — Structure Context

Elliott Wave provides a macro framing for where price is within a broader impulse-correction cycle. Use it as a mental model, not a strict rule set.

**Core structure:**

| Wave | Character | SMC Equivalent |
|------|-----------|----------------|
| **Wave 1** | Initial impulse with moderate volume, emerging from a base | First BOS after CHoCH — early bullish structure |
| **Wave 2** | Sharp or shallow pullback, often retracing 50-78% of Wave 1, low volume | Pullback to OB/FVG in discount zone |
| **Wave 3** | Strongest impulse — widest range, highest volume, extensions common (1.272-1.618) | Clear markup phase, BoS after BoS, HH + HL sequence |
| **Wave 4** | Corrective pullback, typically shallow (retraces 23.6-38.2% of Wave 3), usually different pattern than Wave 2 | Consolidation or absorption before final leg |
| **Wave 5** | Final impulse — narrower than Wave 3, lower volume, possible divergences | Last HH — exhaustion, look for CHoCH setup |

**Corrective waves (A-B-C):**
| Wave | Character | SMC Equivalent |
|------|-----------|----------------|
| **Wave A** | First move against trend, tentative | First CHoCH — potential distribution start |
| **Wave B** | Retrace of A, often 50-78%, can make new highs/lows (B-wave trap) | Sweep + reject — the trap that breaks late traders |
| **Wave C** | Moves beyond A, usually equal to A or 1.272-1.618 extension | Markdown phase, LL + LH sequence |

**Key rules:**
- Wave 2 never retraces beyond the start of Wave 1 (your invalidation level)
- Wave 3 is never the shortest impulse (if Wave 3 < Wave 1, the count is wrong)
- Wave 4 never enters Wave 1 price territory (if it does, trend has failed)
- Alternation: if Wave 2 was sharp, Wave 4 is flat (and vice versa)

**Common extensions to watch (most actionable):**
- Wave 3 extension: 1.272-1.618 of Wave 1 → aggressive TP zone
- Wave 5 failure: if Wave 5 doesn't exceed Wave 3 → double top/bottom → reversal setup
- Wave C = 1.272x Wave A → typical completion zone for corrections

**Elliott + SMC overlap for trade decisions:**

| Elliott Phase | What to Look For | Action |
|---------------|-----------------|--------|
| End of Wave 2 / start of Wave 3 | Price at 0.618-0.79 retrace, OB in discount, declining vol | High-conviction entry with trend |
| Mid Wave 3 | BoS after BoS, rising vol, no pullbacks | Hold / pyramid with structure-based trailing stop |
| End of Wave 5 | Divergence on RSI, narrow-range final bar, lower vol | Exit / prepare for reversal |
| Wave A forming | First CHoCH, sweep of HH/LH level | Exit all remaining, do not add |
| Wave B (trap) | Price reclaims old high/low, weak vol for the direction | Wait for C to confirm |
| Wave C ending | Wave C = Wave A, OB at premium/discount, vol exhaustion | Counter-trend entry if A-grade sweep confirmed |

**Practical notes:**
- Don't force a wave count. If the structure isn't clear, it's probably a range, not an impulse.
- Wave counts are clearest on HTF (4H/D/W). LTF wave counting is noise.
- The most profitable use: identify Wave 3 entries (strongest momentum) and Wave 5 exits (impending reversal).

### 12. Liquidity Vacuum Zones

Areas with no overlapping trading activity — price moves through them easily.

**Where they form:**
- Above/below large consolidation ranges
- After news events
- Between session closes (e.g., Asia close to London open)

**Trading vacuum zones:**
- Price is likely to zoom through with minimal resistance
- If price reverses before reaching a vacuum zone, the vacuum acts as a magnet
- Don't place stops inside vacuum zones (way too wide)

## Output

```
{
  trend: "UP" | "DOWN" | "RANGE",
  bos: "BULLISH" | "BEARISH" | null,
  choch: true | false,
  state: "TRENDING" | "ACCUMULATION" | "DISTRIBUTION" | "RANGING",
  order_blocks: [{ type, status, high, low }],
  fvg: [{ type, status, high, low }],
  liquidity: { dominant_side: "above" | "below", grade: "A" | "B" | "C" | "D" },
  displacement: { confirmed: true | false, side: "bullish" | "bearish" },
  pd_array: { zone: "premium" | "discount", ote: true | false },
  wyckoff: { phase, event } | null,
  fib_clusters: [{ level, grade }],
  vacuum_zone: true | false,
  mss_detected: true | false
}
```

## Next
Pass to `_confluence`
