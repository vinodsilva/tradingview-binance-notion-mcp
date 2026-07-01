---
name: volume-vsa
description: Volume Spread Analysis, VSA bar types, Wyckoff volume signatures, hidden divergence detection
---

# Volume & VSA — Bar-by-Bar Volume Spread Analysis

## Volume Spread Analysis (VSA) — Bar-by-Bar Reading

VSA reads three things on every bar: **Spread (range)**, **Close (position within spread)**, **Volume**.

### Concrete Thresholds

| Metric | Threshold | Definition |
|--------|-----------|------------|
| Wide spread | Range > 1.5x ATR(14) | High volatility bar |
| Narrow spread | Range < 0.7x ATR(14) | Low volatility bar |
| High close | Close in top 33% of range | Close > low + range * 0.67 |
| Low close | Close in bottom 33% of range | Close < low + range * 0.33 |
| Mid close | Close in middle 34% of range | Between low+33% and low+67% |
| High volume | Volume > 1.5x 20-bar avg volume | Above-average participation |
| Low volume | Volume < 0.7x 20-bar avg volume | Below-average participation |

### The 9 Key VSA Bar Types

| # | Spread | Close | Volume | Meaning |
|---|--------|-------|--------|---------|
| 1 | Wide | High | High | Strong upthrust. Trend move. |
| 2 | Wide | Low | High | Strong downthrust. Sell-off. |
| 3 | Wide | Mid | Low | Effort vs result divergence. Weak move. |
| 4 | Narrow | Mid | Low | Resting / consolidation. |
| 5 | Narrow | Mid | High | Absorption. Battle. Pending explosion. |
| 6 | Narrow | High | High | Professional buying. Hidden strength. |
| 7 | Narrow | Low | High | Professional selling. Hidden weakness. |
| 8 | Wide | High | Low | Upthrust on poor volume. Fakeout. |
| 9 | Wide | Low | Low | Downthrust on poor volume. Fakeout. |

### VSA Across Timeframes

1. **W/D**: Identify dominant VSA story (accumulation vs distribution)
2. **60/15**: Find VSA bars that confirm HTF or warn of change
3. **5**: Execute when VSA bar type 6 (hidden strength) or 7 (hidden weakness) at key level

### VSA Divergence (Highest Conviction)

"Effort vs Result" divergence — core VSA signal:

- **Bullish**: Wide spread + mid/low close + very high volume → selling effort yields no breakdown → hidden buying absorbing → BULLISH
- **Bearish**: Wide spread + mid/low close + very high volume (up bar) → buying effort yields no breakout → hidden selling absorbing → BEARISH

---

## Hidden Divergence Multi-Timeframe Detection

### Divergence Detection Method

Use `data_get_study_values()` for RSI readings at pivot points:

```
1. chart_set_timeframe(timeframe)
2. data_get_ohlcv(count=200)  — identify swing pivots
3. data_get_study_values()   — RSI at each pivot
4. Compare price vs RSI movement between pivots
5. Cross-reference volume from OHLCV data
```

### Regular Divergence (Trend Reversal)

**Bullish:** Price = Lower Low, RSI = Higher Low, Volume declining → selling exhausted
**Bearish:** Price = Higher High, RSI = Lower High, Volume declining → buying exhausted

### Hidden Divergence (Trend Continuation)

**Bullish Hidden** (uptrend pullback): Price = Higher Low, RSI = Lower Low, Volume declining → pullback weak, trend resumes
**Bearish Hidden** (downtrend rally): Price = Lower High, RSI = Higher High, Volume declining → rally weak, trend resumes

### Divergence-Volume Confluence

| Divergence | Volume | Conviction |
|-----------|--------|------------|
| Regular + Volume declining | Confirmed reversal | 9/10 |
| Regular + Volume flat | Weak reversal | 5/10 |
| Regular + Volume expanding | May fail | 3/10 |
| Hidden + Volume declining on pullback | Confirmed continuation | 10/10 |
| Hidden + Volume flat | Acceptable | 7/10 |
| Hidden + Volume expanding | Distribution — may fail | 2/10 |

### MCP Tools Used

- `data_get_ohlcv(count=200, summary=false)` — bar-by-bar VSA analysis
- `data_get_study_values()` — RSI at pivots for divergence
