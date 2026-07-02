---
name: _orderflow
description: DOM analysis, bid/ask pressure, absorption patterns
---

# Order Flow — DOM & Bid/Ask Pressure

## Dependencies
None. Can run standalone (requires live DOM data).

## Inputs
```
{
  "dom": { "bids": [ { price, size } ], "asks": [ { price, size } ] },
  "style": "scalp" | "swing"  // DOM is primarily for scalping
}
```

## Steps

### 1. DOM Snapshot

```python
depth_get()  # Returns bids and asks with sizes
```

**Caveats:** Single point-in-time. Large orders flicker, icebergs invisible. Treat as directional hint, not definitive signal.

### 2. Order Book Topology

| Pattern | Description | Implication |
|---------|-------------|-------------|
| Balanced | Bids ≈ Asks in size | Equilibrium. No edge. |
| Stacked bids | Large bids at successive levels | Support zone. May be pulled. |
| Stacked asks | Large asks at successive levels | Resistance zone. May be pulled. |
| Bid wall | Single massive bid | Artificial floor. Likely pulled. |
| Ask wall | Single massive ask | Artificial ceiling. Likely pulled. |
| Sparse | Thin book, wide spreads | Low liquidity. Slippage risk. |

### 3. Key DOM Metrics

- **Bid/Ask ratio**: total bid size / total ask size
  - > 1.5: Buyers aggressive. Bullish.
  - < 0.67: Sellers aggressive. Bearish.
  - 0.8-1.2: Neutral. No edge.

- **Spread**: best bid to best ask distance
  - Widening = uncertainty / low liquidity
  - Narrowing = high participation

- **Depth absorption**: price moves through levels easily → trend momentum. Price stalls → SR.

## Output

```
{
  "topology": "balanced" | "stacked_bids" | "stacked_asks" | "sparse",
  "bid_ask_ratio": 1.5,
  "spread": 0.0002,
  "bid_wall": { "price": 1.0450, "size": 500000 } | null,
  "ask_wall": null,
  "verdict": "bullish" | "bearish" | "neutral",
  "dominant_absorption": "bid_stacking" | "ask_stacking" | null
}
```

## Next Module
Pass output → `_confluence`
