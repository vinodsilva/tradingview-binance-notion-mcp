---
name: market-regime
description: Trend, volatility, market state detection, Market Profile, Auction Market Theory, Volume Profile, multi-timeframe volume analysis
---

# Market Regime — Volume Profile & Trend Analysis

## Volume Hierarchy Rule

Higher timeframe volume always dominates lower timeframe volume. A low-volume breakdown on 15m means nothing if daily volume is expanding bullishly.

### Volume Interaction Matrix

| HTF Volume | LTF Volume | Meaning |
|-----------|-----------|---------|
| Expanding bullish | Contracting bearish | HTF accumulation. LTF selloff weak. Buy the dip. |
| Expanding bearish | Contracting bullish | HTF distribution. LTF bounce weak. Sell the rip. |
| Expanding (both) | Expanding | High participation both ways. Contested. Wait. |
| Contracting (both) | Contracting | Consolidation. Wyckoff Phase B or D. Prepare. |
| HTF expanding | LTF expanding opposite | Trend divergence. Pending reversal. |

### Volume Signature Classification

```python
body_ratio = abs(close - open) / (high - low)
vol_ratio = volume / avg_volume_20
close_position = (close - low) / (high - low)  # 0 = at low, 1 = at high

# IMPULSE — directional bar with conviction, close favors the direction
if vol_ratio > 1.5 and body_ratio > 0.7 and close_position > 0.5:
    signature = "IMPULSE"      # Bullish impulse. Close in top half.
elif vol_ratio > 1.5 and body_ratio > 0.7 and close_position < 0.5:
    signature = "CLIMAX"       # Bearish bar at extreme. Close in bottom half = exhaustion/sweep.
# ABSORPTION — high volume, narrow range = battle between buyers/sellers
elif vol_ratio > 1.5 and body_ratio < 0.3:
    signature = "ABSORPTION"    # High volume, small range = battle
# COMPRESSION — low activity, tightening range
elif vol_ratio < 0.6 and body_ratio < 0.3 and range < avg_range_20 * 0.7:
    signature = "COMPRESSION"   # Low activity, tightening (range narrowing vs 20-bar avg)
# LOW_VOL_THRUST — move without participation (suspect)
elif vol_ratio < 0.6 and body_ratio > 0.7:
    signature = "LOW_VOL_THRUST" # Move without participation (suspect)
```

**Key distinction — IMPULSE vs CLIMAX:**
- IMPULSE: high volume + large body + close in the direction of the move (close_position > 0.5 for up bars, < 0.5 for down bars). The market is committed.
- CLIMAX: high volume + large body + close OPPOSITE the bar's direction (bearish bar with close near low = selling climax). The market swept stops and reversed.
- Example (BTC 58K sweep): body_ratio 0.75, vol_ratio 2.09, close_position 0.18 → CLIMAX (selling exhaustion at range low), NOT impulse. The next bar's close > midpoint would confirm the reversal.

### Volume Confirmation Rules

| Condition | Verdict |
|-----------|---------|
| Breakout + volume > 1.5x avg + close in direction | Confirmed — IMPULSE |
| Breakout + volume < 0.7x avg | Suspect — will likely fail |
| Absorption (high vol + small body) | Battle — pending directional move |
| **Climax (high vol + large body + close at extreme)** | **Exhaustion, not continuation. Often marks sweep/reversal.** |
| Volume climax (3x+ at extremes) | Exhaustion — expect reversal |
| Declining volume on pullback in trend | Healthy |
| Expanding volume on pullback in trend | Distribution / weakness |

---

## Market Profile

Market Profile organizes price and volume into a distribution to identify where price has spent the most time (value) and where activity is thin (excess).

### Key Concepts

| Concept | Definition | Signal |
|---------|------------|--------|
| Point of Control (POC) | Price level with the highest volume traded | Fair value — price tends to return to POC |
| Value Area High (VAH) | Upper boundary where 70% of volume occurred | Resistance in value area |
| Value Area Low (VAL) | Lower boundary where 70% of volume occurred | Support in value area |
| Value Area (VA) | Range between VAH and VAL | Zone of fair value/acceptance |
| High Volume Node (HVN) | Price level/zone with significantly above-average volume | Support/resistance — price respects these |
| Low Volume Node (LVN) | Price level/zone with significantly below-average volume | Gap — price moves through quickly; then reverses from the other side |

### Estimating Market Profile from OHLCV

TradingView MCP has no native Market Profile indicator. Estimate from 200-bar volume distribution:

```python
# Group volume into price buckets to estimate POC and value area
# Use data_get_ohlcv(count=200, summary=false) for raw bars

price_buckets = {}  # {price_bucket: total_volume}
for bar in bars:
    bucket = round(bar.close / bucket_size) * bucket_size
    price_buckets[bucket] = price_buckets.get(bucket, 0) + bar.volume

# POC = bucket with max volume
poc = max(price_buckets, key=price_buckets.get)

# Sort by price, accumulate from POC outward until 70% total volume reached
sorted_buckets = sorted(price_buckets.keys())
total_vol = sum(price_buckets.values())
cum_vol = price_buckets[poc]
vah, val = poc, poc
# Expand outward until cum_vol >= 0.7 * total_vol
```

Alternatively, use `data_get_pine_lines(study_filter="Volume Profile")` if a Volume Profile indicator is already on the chart.

### Market Profile Trading Rules

| Condition | Action |
|-----------|--------|
| Price above VAH, above VA for 3+ bars | Extended — expect reversion to VA |
| Price below VAL, below VA for 3+ bars | Extended — expect reversion to VA |
| Price at POC with declining volume | Low conviction — wait for expansion |
| Price at POC with rising volume | High conviction — continuation likely |
| LVN between current price and POC | Price will move through quickly to POC |
| HVN as resistance | Rejection expected — trade the bounce |

---

## Auction Market Theory (AMT)

Price discovery is an auction process. Four phases describe every market move.

### The Four Phases

#### Balance (Rotation / Consolidation)
Price oscillates in a range. Volume is steady or declining. No directional edge.
- POC is centered in the range
- VAH and VAL are respected repeatedly
- **Action**: Wait for imbalance signal. Trade range extremes with tight stops.

#### Imbalance (Trend / Directional)
Price breaks out of the balance zone with conviction. Volume expands. One side of the auction is dominating.
- Price moves away from POC without returning
- Volume > 1.5x avg on breakout bars
- **Action**: Trade in direction of imbalance. Pullbacks to VA edge are entries.

#### Acceptance
Price returns to a level and the market confirms it as fair value. High volume at the level, narrow spreads.
- Price returns to POC or VA, volume picks up
- Range compresses around the level
- **Action**: Acceptance of a breakout confirms direction. Acceptance of a level confirms support/resistance.

#### Rejection
Price visits a level and immediately reverses, leaving little volume behind. The market is saying "not fair value."
- Wick/long tail at the level
- Low volume at the extreme
- Next bar closes away from the level
- **Action**: The rejected level is a strong entry zone for a reversal trade.

#### Excess
Price briefly moves beyond a clear level (swing high/low, round number) and reverses. This is the market sweeping liquidity.
- Price exceeds a level by < 1% before reversing
- The move beyond has low volume
- Close back inside prior range
- **Action**: Excess marks the end of a move. Anticipate reversal.

### AMT Cycle

```
Balance → Imbalance (breakout) → Acceptance (retest) → 
Trend (continuation) → Excess (climax) → Balance (new range)
```

Identify which phase the market is in on each timeframe. Trade in the direction of the imbalanced TF.

---

## Volume Profile (VP)

Volume Profile is the visual representation of Market Profile using actual volume (not tick count). It shows volume at each price level over a defined period.

### Profile Types

| Type | Period | Use Case |
|------|--------|----------|
| **Composite Profile** | Multiple sessions (e.g., week, month) | HTF value zone — major support/resistance |
| **Session Profile** | Single trading day | Intraday POC, VA, trading ranges |
| **Composite + Session overlay** | Both | Compare HTF value to current session |

### High Volume Nodes (HVN)

Price levels where volume is substantially higher than surrounding prices. Indicates agreement on value.

**HVN detection (per timeframe):**
```
avg_vol_per_price = total_volume / number_of_price_levels
threshold = avg_vol_per_price * 1.5  # 50% above average = HVN

for each price_level:
    if volume_at_level > threshold:
        mark as HVN
```

- HVNs act as support/resistance zones
- Price tends to stall or bounce at HVNs
- Multi-timeframe: W HVN > D HVN > 60 HVN > 15 HVN > 5 HVN in significance

### Low Volume Nodes (LVN)

Price levels where volume is substantially lower than surrounding prices. Indicates a gap in the auction — price moved through without establishing value.

**LVN detection:**
```
threshold = avg_vol_per_price * 0.5  # 50% below average = LVN

for each price_level:
    if volume_at_level < threshold and adjacent levels have normal volume:
        mark as LVN
```

- Price moves through LVNs quickly (liquidity voids)
- Price often reverses from the other side of an LVN
- Common at news gaps, opening gaps, and fast breakouts
- **HVN-to-HVN via LVN**: Price moving from one HVN to another via an LVN has momentum

### Volume Profile Trading Rules

| Pattern | Meaning | Action |
|---------|---------|--------|
| Single POC, tight VA | Strong consensus on value | Range trade — fade extremes |
| Multiple POCs, wide VA | Disagreement on value | Expect breakout or breakdown |
| POC at range low | Support active — buyers stepping in | Long bias |
| POC at range high | Resistance active — sellers capping | Short bias |
| Price above VA + declining volume | Trend stalling, possible excess | Reduce shorts, prepare reversal |
| Price below VA + declining volume | Sell climax, possible absorption | Reduce longs, prepare reversal |

### Multi-Timeframe Volume Profile Integration

| TF | Profile Type | Key Data |
|----|-------------|----------|
| W | Composite (month) | HTF POC — most significant value level on chart |
| D | Composite (week) | Medium-term value zone, key VAH/VAL |
| 6H | Multi-session | Daily session structure (Asia/London/US overlap) |
| 4H | Multi-session | Institutional structure, swing value zones |
| 60 | Multi-hour session | Intraday bias, session POC |
| 15 | Current session | Entry timing — POC proximity, LVN fills |
| 5 | Micro-structure | Last-mile precision, micro-POC |

**Cross-TF Rules:**
- W POC is the single most important level on the chart. All others are secondary.
- D POC aligned with W POC = value consensus. High probability.
- 4H/6H POCs filter the D read — look for alignment across all three.
- 60 POC away from W POC = intraday imbalance. Expect reversion to weekly value.
- LVN on W/D between current price and target = minimal resistance. Price moves through quickly.
- Look for excess (liquidity sweep) on 5M/15M at W/D HVN for reversal entries.
- 5M confirms/denies the 15M read — don't trade 5M alone.

---

## Multi-Timeframe Regime Summary

### 3-TF Core (W/D/4H) — Directional Bias

| W | D | 4H | Interpretation | Action |
|---|----|-----|----------------|--------|
| Bullish | Bullish | Bullish | Strong trend all TFs | Full size in direction |
| Bullish | Bullish | Bearish | Shallow pullback | Buy the dip |
| Bullish | Bearish | Bearish | Deep correction | Wait for D acceptance |
| Bearish | Bearish | Bearish | Strong downtrend all TFs | Full size short |
| Bearish | Bearish | Bullish | Rally in downtrend | Sell the rip |
| Bearish | Bullish | Bullish | Counter-trend rally | Wait for rejection |
| Balance | Balance | Balance | No edge all TFs | Do not trade |

### 5-TF Full Spectrum (W/D/6H/60/15) — Entry Timing

**High timeframe (W/D)**: Sets direction — never trade against.
**Mid timeframe (6H/4H)**: Confirms/denies HTF read. 6H for session context, 4H for swing.
**Execution timeframe (60)**: Sets execution bias — must align with HTF.
**Low timeframe (15/5)**: Entry timing only — never trade LTF alone.

| W | D | 6H/4H | 60 | 15/5 | Conviction |
|---|----|--------|-----|------|------------|
| Trend | Trend | Trend | Trend | Trend | **Sniper** — full size |
| Trend | Trend | Trend | Trend | Pullback | Normal — 0.75x |
| Trend | Trend | Neutral | Pullback | Pullback | Half — 0.5x (wait) |
| Trend | Neutral | Neutral | Pullback | Pullback | Quarter — skip |
| Balance | Balance | X | X | X | No trade — no direction |

**Rule of 7**: W + D + 4H must agree on direction for any trade. 6H confirms. 60 sets bias. 15/5 only determine entry timing.

---

## Price / Trend Regime Classification

Classify current market state to filter trades:

```python
ema50 = get_ema50()
ema200 = get_ema200()
price = get_current_price()

if price > ema50 and ema50 > ema200:
    regime = "BULLISH_TREND"      # Uptrend — long only
elif price < ema50 and ema50 < ema200:
    regime = "BEARISH_TREND"      # Downtrend — short only
elif price > ema200 and ema50 < ema200:
    regime = "BULLISH_CROSSOVER"  # Early uptrend — caution
elif price < ema200 and ema50 > ema200:
    regime = "BEARISH_CROSSOVER"  # Early downtrend — caution
elif price between ema50 and ema200:
    regime = "RANGE"              # Consolidation — fade extremes
elif gain_20_bars > 100 and avg_vol_ratio > 1.5 and price > ema50:
    regime = "LOW_CAP_PARABOLIC"  # Parabolic move — special rules apply
```

Each regime dictates which setups are valid.

### LOW_CAP_PARABOLIC Regime Rules

Detection: >100% gain in <20 bars, volume >1.5x avg sustained, price above EMA 50 on W and D.

**Parabolic markets DO NOT correct normally — they gap, spike, and shake out.** Standard Wyckoff, VSA, and liquidity analysis FAILS on parabolic low-caps because:
- Distribution does not occur until volume drops >50% AND 2 consecutive TFs show CHOCH
- Every liquidity sweep to the downside is a shakeout before continuation up
- RSI > 80 can stay overbought for weeks (SYNUSDT: W RSI 92.31, still going up)
- Pullbacks are 1-3 bars, not 20-bar retracements

**Trading rules for LOW_CAP_PARABOLIC:**

| Rule | Detail |
|------|--------|
| **No shorting** | Absolutely no short until W + D both show CHOCH with volume. Parabolic moves gap through stops. |
| **No Phase E assignment** | Do not label Wyckoff Phase E until volume drops >50% from peak for 10+ bars on D. |
| **Buy only on D-level pullback** | Entry only when price pulls back to D EMA 50 or D OB with declining volume <0.6x avg. |
| **Liquidity rejections are inducements** | Every time price approaches a prior high and rejects = inducement to shake out longs, not a failed breakout. |
| **Trailing stop only** | No fixed targets. Trail with D EMA 20 or 1.5x ATR. Parabolic moves have no ceiling. |
| **Reduce size by 50%** | Parabolic moves gap 10-20% in one candle. 0.5x size max. |
| **2-TF CHOCH required** | Do not call a top until W + D or D + 4H both show CHOCH with expanding volume. One TF CHOCH alone is noise in parabolic. |

**When to exit long:** W closes below W EMA 50 OR D closes below D EMA 50 with volume >1.5x avg + 2 consecutive lower highs.

### MCP Tools Used

- `data_get_ohlcv(count=200, summary=true)` — volume stats, avg volume, bar range
- `data_get_ohlcv(count=200, summary=false)` — body ratio per bar, volume distribution
- `data_get_study_values()` — RSI, ATR, VWAP for momentum and value context
- `data_get_pine_lines(study_filter="Volume Profile")` — HVN/LVN/POC if Volume Profile indicator on chart
- `capture_screenshot(region="chart")` — visual confirmation of Market Profile structure
