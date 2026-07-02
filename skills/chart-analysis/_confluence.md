---
name: _confluence
description: Scoring checklists (scalp + swing), confluence toolkit, Fibonacci + SMC integration
---

# Confluence — Scoring & Conviction

## Dependencies
- `_structure` → provides liquidity grade, structure trend/state, order_blocks, fvg, inducement, wyckoff, elliott, fib_clusters, structure_score
- `_volume` → provides bars_classified, scalp_patterns, stop_hunts, divergences, dominant_signature
- `_orderflow` → provides topology, bid_ask_ratio, verdict

## Inputs
```
{
  "style": "scalp" | "swing",

  "structure": {
    liquidity: { grade, dominant_side },
    structure: { trend, bos, choch, state },
    order_blocks: [{ type, status, strength }],
    fvg: [{ type, status, strength }],
    inducement: { detected },
    wyckoff: { phase, event },
    elliott: { valid, context },
    fib_clusters: [{ grade, strength }],
    vacuum_zone: bool,
    structure_score: int
  },

  "volume": {
    bars_classified: [{ index, type, scalp_type, description }],
    scalp_patterns: [{ pattern, direction, trigger_bar }],
    stop_hunts: [{ level, direction, volume_ratio, wick_ratio }],
    divergences: [{ type, strength, price_high_1, price_high_2, rsi_1, rsi_2, verdict }],
    dominant_signature: "IMPULSE" | "ABSORPTION" | "COMPRESSION" | null
  },

  "orderflow": {
    topology: "balanced" | "stacked_bids" | "stacked_asks" | "sparse",
    bid_ask_ratio: float,
    verdict: "bullish" | "bearish" | "neutral"
  }
}
```

## Steps

### 1. Directional Vote Gate

The directional bias is derived from `_structure`:

| Source | Signal |
|--------|--------|
| `structure.trend` | `"UP"` ↔ LONG, `"DOWN"` ↔ SHORT, `"RANGE"` ↔ NEUTRAL |
| `structure.bos` | Confirms trend with BOS direction |
| `structure.structure_score` | > 70 reinforces vote, < 50 reduces conviction |
| `inducement.detected` | If true, reduce conviction |

If `structure.structure` has no clear trend (`"RANGE"`) and no BOS → `NO_TRADE`.

### 2. Scalp Confluence Checklist (12 Points)

| # | Factor | Weight | Y/N |
|---|--------|--------|-----|
| 0. | Structure trend = LONG/SHORT | **Must-pass** | |
| 1. | Session is liquid window | **Must-pass** | |
| 2. | 15M ATR% >= 0.08% | **Must-pass** | |
| 3. | Price within 0.3% of unmitigated OB/Breaker/unfilled FVG | 2x | |
| 4. | Engine phase: low-vol drift, declining volume | 2x | |
| 5. | Sweep confirmed: vol > 1.5x, price reclaimed | 3x | |
| 6. | DOM confirmation: bid stacking (long) or ask stacking (short) | 2x | |
| 7. | VSA alignment: S6 stop-hunt pattern detected | 1x | |
| 8. | LTF trend supports direction | 1x | |
| 9. | No major news in +/- 15 min | **Must-pass** | |
| 10. | R:R >= 1.5 (scalp minimum) | 2x | |
| 11. | RSI divergence detected supporting direction (hidden = Y, regular = N) | 1x | |
| 12. | 2+ Fib projections cluster at entry zone within 0.2% | 1x | |

```python
# Score (excl must-pass): max 15
if score >= 12 and no must-pass failed: conviction = "SCALP_TRADE"
elif score >= 9 and no must-pass failed:  conviction = "SCALP_REDUCED"
else:                                      conviction = "NO_TRADE"
```

### 3. Swing Confluence Checklist (16 Points)

| # | Factor | Y/N |
|---|--------|-----|
| 0. | Structure trend matches trade direction | **Must-pass** |
| 1. | HTF trend matches trade direction | |
| 2. | BOS/CHOCH with vol > 1.5x in trade direction | |
| 3. | A/B-grade sweep supports direction | |
| 4. | Unmitigated OB or Breaker at entry zone | |
| 5. | Unfilled FVG/IFVG at entry zone | |
| 6. | OB is FRESH (Y) or mitigated (N) | |
| 7. | EW alignment: entry at Wave 2 or Wave 4 retrace | |
| 8. | 3+ Fib projections converge within 0.3% | |
| 9. | Fib cluster grade A or S | |
| 10. | Volume > 1.5x at key level bar | |
| 11. | Trend health: pullback vol declining, impulse quality high | |
| 12. | RSI not extended (40-70 bull, 30-60 bear) | |
| 13. | RSI divergence supports direction (hidden > regular > none) | |
| 14. | VSA bars consistent with thesis | |
| 15. | No vacuum zone in trade path | |
| 16. | R:R >= 2, stop structurally placed | |

```python
score = sum of Y (out of 16)
if score >= 14 and vote_passed:   conviction = "SNIPER"     # 1.0% risk
elif score >= 12 and vote_passed: conviction = "NORMAL"     # 0.75% risk
elif score >= 10 and vote_passed: conviction = "HALF"       # 0.5% risk
else:                              conviction = "NO_TRADE"
```

#### EW Overrides
- Wave 3 entry → +1 to score (valid at 9/15 if others strong)
- Wave B entry → -2 penalty (need 12+ to override)
- Wave 5 → cap at NORMAL regardless of score

### 4. Tradable Confluence Checks (Standalone Toolkit)

Used when you need to check individual factors without running full scoring:

- **Turtle Trend Filter:** Price above EMA50+200 → bullish bias. Below both → bearish. Between → reduce/pass.
- **Volume Confirmation:** Breakout with vol > 1.5x avg → confirmed. Below avg → suspect.
- **Livermore Pivots:** Higher highs + higher lows → bullish. Lower highs + lower lows → bearish.
- **Pattern Recognition:** All breakouts must have volume confirmation.
- **RSI Regime:** > 70 overbought, 50-70 bullish, 30-50 bearish, < 30 oversold.
- **RSI Divergence (4 types):**
  - **Hidden Bullish** — price HL, RSI LL in uptrend pullback → continuation LONG. Size up.
  - **Hidden Bearish** — price LH, RSI HH in downtrend pullback → continuation SHORT. Size up.
  - **Regular Bullish** — price LL, RSI HL at support → reversal LONG. Normal size + volume confirmation.
  - **Regular Bearish** — price HH, RSI LH at resistance → reversal SHORT. Normal size + volume confirmation.
  - Hidden divergence is the **strongest divergence signal** (trend continuation has highest probability).
- **Supply/Demand Zones:** First touch highest probability. Each retest weakens ~30%.
- **Minervini VCP:** Contracting range + declining volume = highest conviction setup.
- **Fib + OB Integration:** 0.618 Fib + order block + declining volume = sniper entry.

#### R:R Validation

```python
# Asymmetry: resistance distance / support distance >= 3:1 minimum
if resistance_dist / support_dist >= 3:  asymmetry = True
```

### 5. Contrarian Sweep Rules

| Condition | Action |
|-----------|--------|
| Sweep A + counter to HTF trend | 0.5x swing / 0.75x scalp. Must have 60M BOS confirmation. |
| Sweep B + counter to HTF trend | NO TRADE (swing). 0.5x (scalp if DOM confirms). |
| Sweep C + counter to HTF trend | Skip entirely. |
| Sweep A/B + aligned with HTF | Full size. |

## Output

```
{
  "style": "scalp" | "swing",
  "direction": "LONG" | "SHORT" | null,   // from structure trend gate
  "conviction": "SNIPER" | "NORMAL" | "HALF" | "SCALP_TRADE" | "SCALP_REDUCED" | "NO_TRADE",
  "score": 13,  // X/15 or X/16
  "scoring_table": [
    { "factor": "Sweep confirmation", "pass": true, "weight": 3 }
  ],
  "must_pass_failures": [],
  "ew_override": "BONUS+1" | "CAP_NORMAL" | "PENALTY-2" | null,
  "asymmetry_ratio": 3.5,
  "atr_pct": 0.15,                           // from setup study_values on entry TF
  "entry_zone": { "price": 1.0450, "zone_type": "OB+FIB+SWEEP", "grade": "A" },
  "no_trade_reason": null | string,
  "rr": { "min": 1.5, "actual": 2.3 }
}
```

## Next Module
- If `conviction == "NO_TRADE"` → `_report`
- If conviction exists → `_sizing`
