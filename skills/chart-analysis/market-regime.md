---
name: market-regime
description: Trend, volatility, market state detection, multi-timeframe volume analysis
---

# Market Regime — Volume & Trend Analysis

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

# IMPULSE — directional bar with conviction
if vol_ratio > 1.5 and body_ratio > 0.7:
    signature = "IMPULSE"
# ABSORPTION — high volume, narrow range = battle
elif vol_ratio > 1.5 and body_ratio < 0.3:
    signature = "ABSORPTION"
# COMPRESSION — low activity, tightening range
elif vol_ratio < 0.6 and body_ratio < 0.3:
    signature = "COMPRESSION"
# LOW_VOL_THRUST — move without participation (suspect)
elif vol_ratio < 0.6 and body_ratio > 0.7:
    signature = "LOW_VOL_THRUST"
```

### Volume Confirmation Rules

| Condition | Verdict |
|-----------|---------|
| Breakout + volume > 1.5x avg + close in direction | Confirmed — IMPULSE |
| Breakout + volume < 0.7x avg | Suspect — will likely fail |
| Absorption (high vol + small body) | Battle — pending directional move |
| Volume climax (3x+ at extremes) | Exhaustion — expect reversal |
| Declining volume on pullback in trend | Healthy |
| Expanding volume on pullback in trend | Distribution / weakness |

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

### 5-TF Full Spectrum (W/D/4H/60/15) — Entry Timing

| W | D | 4H | 60 | 15/5 | Conviction |
|---|----|-----|-----|------|------------|
| Trend | Trend | Trend | Trend | Trend | **Sniper** — full size |
| Trend | Trend | Trend | Trend | Pullback | Normal — 0.75x |
| Trend | Trend | Neutral | Pullback | Pullback | Half — 0.5x (wait) |
| Trend | Neutral | Neutral | Pullback | Pullback | Quarter — skip |
| Balance | Balance | X | X | X | No trade — no direction |

---

## Price / Trend Regime Classification

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
else:
    regime = "RANGE"              # Consolidation — fade extremes
```

### MCP Tools Used

- `data_get_ohlcv(count=100, summary=true)` — volume stats
- `data_get_ohlcv(count=100, summary=false)` — body ratio per bar
- `data_get_study_values()` — RSI, VWAP for momentum and value context
- `capture_screenshot(region="chart")` — visual confirmation
