---
name: _confluence
description: Directional vote, confluence checklist, conviction grading
---

# Confluence — Scoring & Decision

## Dependencies
- `_structure` → trend, BOS/CHoCH, OBs (mitigation/breaker/reversal), FVGs (5 types), liquidity (A-D grading, sweep outcomes), PD arrays, fib clusters, displacement quality, MSS, Wyckoff, Elliott Wave, multi-TF alignment
- `_volume` → VSA bar types, effort vs result, stop hunts, dominant signature, volume profile (POC/VAH/VAL/HVN/LVN), climax, squeeze, RSI divergence (regular + hidden)

## Steps

### 1. Directional Vote

Derive bias from structure. Use multi-TF alignment to grade conviction:

**W + D alignment = primary bias:**
- W UP + D UP → strong bullish bias
- W DOWN + D DOWN → strong bearish bias
- W UP + D pullback to discount → bullish with timing risk (wait for 4H/1H retest)
- W DOWN + D bounce to premium → bearish with timing risk
- W RANGE or D RANGE → no directional edge → NO TRADE from bias

**Structure confirmation:**
- BOS direction must support the vote
- CHoCH appearing = transition phase, reduce size
- Elliott Wave context: Wave 3 formation = highest confidence. Wave 5 = risk of exhaustion.
- MSS detected against the vote → invalidate. Do not trade against MSS.

### 2. Confluence Checklist

The checklist pulls from both _structure and _volume outputs. Each item is scored based on how well the market supports the directional vote.

| Score | Conviction |
|-------|------------|
| 9-11/11 | SNIPER |
| 7-8/11 | NORMAL / HALF |
| < 7/11 | NO TRADE |

**Must-pass items:** Structure trend aligns, session is liquid, ATR >= 0.08%, no major news. Any fails → NO TRADE.

#### Scalp Checklist (11 items)

| # | Item | Source | Must-pass? |
|---|------|--------|-----------|
| 1 | Structure trend = direction | _structure | ✓ |
| 2 | Session is liquid window | _setup | ✓ |
| 3 | ATR% >= 0.08% | _setup | ✓ |
| 4 | Price within 0.3% of unmitigated OB or unfilled FVG | _structure | |
| 5 | Low-vol drift / declining vol (squeeze or absorption character) | _volume | |
| 6 | Sweep confirmed (A/B grade, vol > 1.5x, reclaimed) | _structure + _volume | |
| 7 | DOM confirms (bid/ask stacking) | _orderflow | |
| 8 | VSA stop-hunt pattern (S6) or effort vs result confirms | _volume | |
| 9 | LTF (15m/5m) trend supports direction | _structure | |
| 10 | No major news +/- 15 min | _setup | ✓ |
| 11 | R:R >= 1.5 | _sizing | |

#### Swing Checklist (11 items)

| # | Item | Source | Must-pass? |
|---|------|--------|-----------|
| 1 | Structure trend matches direction | _structure | ✓ |
| 2 | HTF (W/D) trend matches direction | _structure | |
| 3 | BOS/CHoCH with vol confirmation (displacement > 1.5x) | _structure + _volume | |
| 4 | A/B-grade sweep supports direction, grade A preferred | _structure | |
| 5 | Unmitigated OB (mitigation/breaker) or unfilled FVG (body FVG preferred) at entry zone | _structure | |
| 6 | Volume > 1.5x avg at the key level break (genuine, not fakeout VSA 8/9) | _volume | |
| 7 | Trend health: pullback vol declining (absorption, not distribution) | _volume | |
| 8 | RSI not extended (40-70 for bull, 30-60 for bear) | _volume | |
| 9 | RSI divergence supports direction (hidden > regular) | _volume | |
| 10 | No vacuum zone in trade path to target | _structure | |
| 11 | R:R >= 2 | _sizing | |

### 3. Multi-TF Alignment Check

Grade how well the TFs stack before committing to conviction:

| Alignment | Grade | Meaning |
|-----------|-------|---------|
| W + D + 4H all aligned with direction | **Full stack** | Highest confidence. Size accordingly. |
| W + D aligned, 4H pulling back but in discount/premium zone | **Timing** | Good setup waiting for 4H trigger |
| W aligned, D mixed (ranging/transition), 4H aligned | **Reduced** | Lower confidence. Use smaller size. |
| W + D aligned, 4H MSS forming against bias | **Wait / Invalid** | Do not enter. MSS often precedes reversal. |
| No TF alignment | **No trade** | Market lacks clear directional conviction. |

### 4. Volume + Structure Confluence

Combine _structure and _volume outputs for higher-confidence reads:

**High-probability setup (score 3/3):**
- Price at HTF discount zone (PD array) ✓
- Mitigation OB or body FVG present at same level ✓
- Declining volume on approach (absorption / squeeze) ✓

**Medium-probability setup (score 2/3):**
- Any two of the above

**Low-probability setup (score 0-1/3):**
- Price at premium zone for a long (wrong PD array context)
- Rising volume on approach to OB (distribution, not absorption)
- Weak FVG (wick-only, opening gap) with no OB overlap

**Kill conditions (any one invalidates the setup):**
- Climax detected in the trade direction (exhaustion)
- Expansion bar fired against the trade direction
- Effort vs result divergence on the approach bars (high vol, no price progress)
- MSS triggered against the trade direction

### 5. Conviction Grading

| Conviction | Score | Volume Character | PD Array | Sweep | Action |
|------------|-------|-----------------|----------|-------|--------|
| SNIPER | 9-11/11 | IMPULSE or squeeze expansion | Price in discount (bull) / premium (bear) | A-grade | Full size. Entry trigger only. |
| NORMAL | 7-8/11 | ABSORPTION at zone | Price in discount/premium | A or B grade | 0.75x. Wait for retest confirmation. |
| HALF | 7-8/11 (weak supporting) | COMPRESSION or mixed | At PD array boundary | B or C grade | 0.5x. Reduce if any kill condition present. |
| NO_TRADE | < 7/11 or must-pass fail | MIXED or climax | Wrong zone | C/D grade or none | Skip. No entry. |

### 6. Contrarian Rules

- Counter-trend sweep with A-grade sweep at HTF + price at PD array extreme → reduced size only
- Counter-trend sweep with B/C grade → NO TRADE
- Trend-aligned sweep + full PD array alignment + impulse character → full conviction
- Elliott Wave: Wave 5 of the larger cycle → do not add. Only manage exits.
- Elliott Wave: Wave 3 of the larger cycle → hold through pullbacks, pyramid into strength.

## Output

```
{
  direction: "LONG" | "SHORT" | null,
  conviction: "SNIPER" | "NORMAL" | "HALF" | "NO_TRADE",
  score: X/11,
  must_pass_failures: [],
  multi_tf_alignment: "full_stack" | "timing" | "reduced" | "wait",
  volume_structure_confluence: 0-3,
  entry_zone: { price, zone_type, grade },
  rr: { min, actual },
  no_trade_reason: null | string
}
```

## Next
- `NO_TRADE` → skip to `_report`
- Conviction exists → `_sizing`
