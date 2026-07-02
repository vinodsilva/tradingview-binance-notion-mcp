---
name: orderflow
description: Order flow analysis — DOM depth, bid/ask pressure, absorption patterns
---

# Order Flow — DOM & Bid/Ask Pressure

## Depth of Market (DOM) Analysis

Use `depth_get()` to read the current order book:

```python
depth_get()  # Returns bids and asks with sizes
```

**Important caveats:** `depth_get()` is a single point-in-time snapshot. In crypto/futures markets, large orders flicker in/out, icebergs are invisible, and a snapshot cannot show order flow momentum. Treat DOM as a directional hint, not a definitive signal.

### Order Book Topology

| Pattern | Description | Implication |
|---------|-------------|-------------|
| Balanced | Bids ≈ Asks in size distribution | Equilibrium. No edge. |
| Stacked bids | Large bid clusters at successive levels | Possible support zone. May be pulled before tested. |
| Stacked asks | Large ask clusters at successive levels | Possible resistance zone. May be pulled before tested. |
| Bid wall | Single massive bid order | Artificial floor. Likely to be pulled after fills. |
| Ask wall | Single massive ask order | Artificial ceiling. Likely to be pulled after fills. |
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

### MCP Tools Used

- `depth_get()` — order book depth (bids/asks/sizes). Single snapshot only.
- `data_get_ohlcv(count=100, summary=false)` — VSA bar classification per bar
