---
name: _orderflow
description: DOM analysis, bid/ask pressure, absorption patterns
---

# Order Flow — DOM & Bid/Ask Pressure

## Dependencies
None. Requires live DOM data via `depth_get()`.

## Steps

### 1. Take DOM Snapshot
`depth_get()` → bids and asks with sizes.

Caveat: Single point-in-time. Large orders flicker, icebergs invisible. Directional hint, not definitive.

### 2. Classify Order Book Topology

| Pattern | Description | Implication |
|---------|-------------|-------------|
| Balanced | Bids ≈ Asks | No edge |
| Stacked bids | Large bids at successive levels | Support zone |
| Stacked asks | Large asks at successive levels | Resistance zone |
| Bid wall | Single massive bid | Artificial floor — likely pulled |
| Ask wall | Single massive ask | Artificial ceiling — likely pulled |
| Sparse | Thin book, wide spread | Low liquidity, slippage risk |

### 3. Key Metrics
- **Bid/ask ratio:** > 1.5 = buyers aggressive; < 0.67 = sellers aggressive
- **Spread:** widening = uncertainty; narrowing = high participation
- **Depth absorption:** price moves through levels easily = trend momentum; stalls = resistance

## Output

```
{ topology, bid_ask_ratio, spread, bid_wall, ask_wall, verdict: "bullish" | "bearish" | "neutral" }
```

## Next
Pass to `_confluence`
