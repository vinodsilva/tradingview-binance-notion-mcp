---
name: volume-vsa
description: Volume Spread Analysis, VSA bar types, Wyckoff volume signatures
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

### VSA Divergence (Highest Conviction)

"Effort vs Result" divergence — core VSA signal:

- **Bullish**: Wide spread + mid/low close + very high volume → selling effort yields no breakdown → hidden buying absorbing → BULLISH
- **Bearish**: Wide spread + mid/low close + very high volume (up bar) → buying effort yields no breakout → hidden selling absorbing → BEARISH

### MCP Tools Used

- `data_get_ohlcv(count=100, summary=false)` — bar-by-bar VSA analysis
- `data_get_study_values()` — RSI at pivots for divergence
