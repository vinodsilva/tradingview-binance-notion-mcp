---
name: orderflow
description: Order flow analysis — DOM depth, delta estimation, bid/ask pressure, absorption patterns, order book topology
---

# Order Flow — DOM, Delta & Bid/Ask Pressure

## Depth of Market (DOM) Analysis

Use `depth_get()` to read the current order book:

```python
depth_get()  # Returns bids and asks with sizes
```

**Important caveats:** `depth_get()` is a single point-in-time snapshot. In crypto/futures markets, large orders flicker in/out, icebergs are invisible, and a snapshot cannot show order flow momentum. Treat DOM as a directional hint, not a definitive signal. Prefer comparing 2-3 snapshots taken ~5s apart.

### Order Book Topology

| Pattern | Description | Implication |
|---------|-------------|-------------|
| Balanced | Bids ≈ Asks in size distribution | Equilibrium. No edge. |
| Stacked bids | Large bid clusters at successive levels | Possible support zone. May be pulled before tested. |
| Stacked asks | Large ask clusters at successive levels | Possible resistance zone. May be pulled before tested. |
| Bid wall | Single massive bid order | Artificial floor. Likely to be pulled after fills. |
| Ask wall | Single massive ask order | Artificial ceiling. Likely to be pulled after fills. |
| Iceberg | Small visible size, massive total size at level | Hidden institutional interest. |
| Sparse | Thin order book, wide spreads | Low liquidity. Slippage risk. |

### Key DOM Metrics

- **Bid/Ask ratio**: total bid size / total ask size
  - > 1.5: Buyers aggressive. Bullish pressure.
  - < 0.67: Sellers aggressive. Bearish pressure.
  - 0.8-1.2: Neutral. No directional edge.

- **Spread**: distance between best bid and best ask
  - Widening = uncertainty / low liquidity
  - Narrowing = high participation / tight markets

- **Depth absorption**: Large market orders eating through multiple levels
  - If price moves through levels easily → trend momentum
  - If price stalls at a level → support/resistance

---

## Delta — Real vs Estimated

**Real delta** requires tick-level bid/ask volume data — not available via MCP tools. Only delta from a dedicated order flow platform (Bookmap, Sierra Chart) is reliable.

### OHLCV Delta Estimate (Use With Caution)

The formula below assumes volume is uniformly distributed within a bar, which is almost never true. Treat this as a rough directional proxy only — no position sizing or conviction decisions should come from it.

```python
# Delta estimate — directional proxy only, NOT real delta
bullish_vol_est = volume * (close - low) / (high - low)  # Assumes uniform distribution
bearish_vol_est = volume * (high - close) / (high - low)
delta_est = bullish_vol_est - bearish_vol_est
```

### Estimated Delta Signatures

| Pattern | Bar | Meaning |
|---------|-----|---------|
| Positive, price up | Green | Possible buying |
| Negative, price down | Red | Possible selling |
| Positive, price down | Red | Possible absorption |
| Negative, price up | Green | Possible distribution |

---

## Absorption Detection (VSA-based)

Absorption detection works from price/volume data alone — no delta required. Use VSA bar classification (see `volume-vsa.md`) instead of estimated delta.

### Absorption Criteria (VSA)

```python
# Bullish absorption
if range > avg_range * 1.5          # Wide spread
   and body_ratio < 0.3              # Small body
   and volume > avg_volume * 2:      # Very high volume
   # Close position within range tells the story. If close is mid-to-high,
   # selling effort produced no breakdown = hidden buying = bullish.
   absorption_price_held = close > low + range * 0.4
   
# Bearish absorption
if range > avg_range * 1.5          # Wide spread
   and body_ratio < 0.3              # Small body
   and volume > avg_volume * 2:      # Very high volume
   # If close is mid-to-low, buying effort produced no breakout = bearish.
   absorption_price_capped = close < low + range * 0.6
```

### Absorption vs Climax (VSA, No Delta)

| Signal | Volume | Range | Close | VSA Type | Action |
|--------|--------|-------|-------|----------|--------|
| Bullish absorption | 2x+ | Wide | Mid-High | Type 5 | Reversal up |
| Selling climax | 3x+ | Wide | Low | Type 2 | Exhaustion bottom |
| Bearish absorption | 2x+ | Wide | Mid-Low | Type 5 | Reversal down |
| Buying climax | 3x+ | Wide | High | Type 1 | Exhaustion top |

---

## Order Flow Imbalance (from Bar Data)

### Imbalance Ratio

```python
imbalance = (close - open) / (high - low) * volume  # Weighted delta

if imbalance > volume * 0.3:    # Strong buying imbalance
if imbalance < volume * -0.3:   # Strong selling imbalance
```

### Imbalance by Trend Position

| Position | Imbalance | Meaning |
|----------|-----------|---------|
| Start of trend | Heavy imbalance, expanding | Fresh institutional entry |
| Mid trend | Imbalance oscillating | Healthy trend with participation |
| End of trend | Imbalance shrinking on thrust | Exhaustion. Divergence. |
| Range low | Positive imbalance spike | Bids stepping in. Support. |
| Range high | Negative imbalance spike | Offers stepping in. Resistance. |

---

## Execution Level Order Flow

On execution timeframe (15M or 5M), check before entry:

1. `depth_get()` — note bid/ask distribution. Take 2 snapshots 5s apart for comparison.
2. Are large orders persistent across both snapshots or do they flicker?
3. Is the spread compressing or expanding?
4. VSA bar types at key levels — is there absorption (type 5) or a climax (type 1/2)?

**DOM as a filter, not a signal.** If the order book consistently shows stacked asks above resistance, be cautious about buying the breakout. But DOM snapshots are unreliable — overweight price-action evidence.

### MCP Tools Used

- `depth_get()` — order book depth (bids/asks/sizes). Single snapshot only.
- `data_get_ohlcv(count=200, summary=false)` — VSA bar classification per bar
