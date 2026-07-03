---
name: _volume
description: VSA bar classification, volume comparison, stop-hunt detection, volume profile concepts, divergence
---

# Volume — VSA, Volume Profile & Market Structure

## Dependencies
- `_setup` → provides OHLCV bars and study_values per TF

## Inputs
Raw OHLCV bars from `data_get_ohlcv(summary=false)` per TF. RSI from `data_get_study_values`.

## Steps

### 1. Compute Volume Baseline
Compare each bar's volume against the 20-bar SMA of volume (computed from OHLCV data):
- **High vol** > 1.5x avg
- **Low vol** < 0.7x avg

### 2. Classify Bars (Mental Model — VSA Types)

| # | Spread | Close | Volume | Signal |
|---|--------|-------|--------|--------|
| 1 | Wide | High | High | Strong trend move |
| 2 | Wide | Low | High | Sell-off |
| 3 | Wide | Mid | Low | Effort vs result divergence (weak) |
| 4 | Narrow | Mid | Low | Resting / consolidation |
| 5 | Narrow | Mid | High | Absorption — explosion pending |
| 6 | Narrow | High | High | Professional buying (hidden strength) |
| 7 | Narrow | Low | High | Professional selling (hidden weakness) |
| 8 | Wide | High | Low | Fakeout breakout |
| 9 | Wide | Low | Low | Fakeout breakdown |

**Effort vs Result — the most important VSA principle:**
- High vol + wide range = effort matches result → trend is healthy
- High vol + narrow range = effort with no result → absorption or distribution
- Low vol + wide range = thin move, likely to snap back (type 8/9)
- Rising vol + rising range = accelerating trend
- Rising vol + shrinking range = climax/deceleration

### 3. Detect Stop Hunts
Look for bars where price sweeps a key level then closes back through it with high volume:
- **Sell-side (bullish):** low < level, close > level, vol > 2x avg, bullish body
- **Buy-side (bearish):** high > level, close < level, vol > 2x avg, bearish body

### 4. Classify Dominant Volume Character
Assess the overall feel of the recent bars:
- **IMPULSE** — mostly wide-range, high-vol bars in one direction
- **ABSORPTION** — high vol but price contained (battle)
- **COMPRESSION** — narrow ranges, declining vol
- **MIXED** — no dominant signature

### 5. Volume Profile Concepts (Mental Model)

Volume profile reveals where the most trading activity occurred at each price level. While MCP provides per-bar volume (not per-tick volume), you can approximate these concepts.

**POC (Point of Control):** The price level with the highest traded volume in the period.
- Acts as the market's perceived "fair price"
- Price tends to return to POC (magnet behavior)
- When above POC → premium zone. When below POC → discount zone.
- Breakaway from POC with high vol = directional conviction

**VAH / VAL (Value Area High / Low):** The price range where ~70% of volume traded.
- Within value area = market is balanced
- Above VAL but below VAH = equilibrium — no edge
- Outside value area (above VAH or below VAL) = inefficient — price tends to return

**To approximate from OHLCV data:**
- Identify bars with the highest volume — their close price ≈ POC
- The narrow price band where the highest-vol bars clustered ≈ Value Area
- When current price is far from the high-volume cluster → imbalance

**High Volume Node (HVN):** A price level with significantly more volume than surrounding levels.
- Acts as support/resistance (institutions defended this level)
- When price returns to HVN, expect a reaction
- Multiple HVNs at same price → very strong level

**Low Volume Node (LVN):** A price level with significantly less volume.
- Price moves through LVNs easily (vacuum zone)
- If price reverses before reaching an LVN, the LVN acts as a magnet

### 6. Volume at Key Levels

Use volume to judge the strength of support/resistance levels identified in _structure:

| Price at Level | Volume Pattern | Meaning |
|---------------|---------------|---------|
| Testing support | Declining vol (absorption) | Bulls defending — level likely holds |
| Testing support | Rising vol, price stalling | Distribution — level likely breaks |
| Breaking resistance | Expanding vol, wide range | Genuine breakout — trend continues |
| Breaking resistance | Low vol, narrow range | Fakeout — snapping back (VSA type 8) |
| Rejecting level | High vol, long wick | Strong rejection — level confirmed |
| Rejecting level | Low vol, short wick | Weak rejection — level likely retested |

### 7. Buying / Selling Climax

A climax marks the end of a trend move. Look for:

**Buying climax (top):**
- 2-3 Wide-range bars with vol > 2x avg
- Followed by a narrow-range bar with high vol (absorption)
- Long upper wick on the final bar
- Next bar closes lower on declining vol

**Selling climax (bottom):**
- 2-3 Wide-range red bars with vol > 2x avg
- Followed by a narrow-range bar with high vol (absorption)
- Long lower wick on the final bar
- Next bar closes higher on declining vol

Climax + CHoCH = high-probability reversal. Climax without CHoCH = pause before continuation.

### 8. Squeeze — Compression + Expansion

Periods of low volatility compress before a directional explosion.

**Squeeze pattern from OHLCV:**
- 5+ bars with declining range and declining vol
- Bar ranges < 50% of their 20-bar average
- Volume falling below 0.7x baseline

**Expansion (the trigger):**
- A bar with range > 1.5x recent avg + vol > 1.5x avg
- The direction of the expansion bar = the likely trend direction
- If expansion is in the HTF trend direction = high-conviction entry
- If expansion is against HTF trend = likely counter-trend, reduced size

### 9. Check RSI Divergence
Use `data_get_study_values` for RSI readings. Compare consecutive swing points on price vs RSI:
- **Regular bearish:** price HH, RSI LH → reversal short
- **Regular bullish:** price LL, RSI HL → reversal long
- **Hidden bearish:** price LH, RSI HH → continuation short
- **Hidden bullish:** price HL, RSI LL → continuation long

Hidden divergence on the entry TF is the strongest signal (trend continuation).

**RSI + Volume confluence:**
- Divergence + declining vol at key level = high-probability reversal
- Divergence + rising vol = trend may persist (momentum pushing through)
- No divergence + rising vol = trend is healthy

## Output

```
{
  bars_classified: [{ type, vol_ratio, range_ratio }],
  stop_hunts: [{ side, level, quality }],
  dominant_signature: "IMPULSE" | "ABSORPTION" | "COMPRESSION" | "MIXED",
  divergences: [{ type, strength }],
  volume_profile: { poc_approx, value_area, hvn_levels, lvn_levels },
  squeeze: { compressed: true | false, direction: "bull" | "bear" | null },
  climax: { detected: true | false, type: "buying" | "selling" }
}
```

## Next
Pass per TF to `_confluence` for scoring
