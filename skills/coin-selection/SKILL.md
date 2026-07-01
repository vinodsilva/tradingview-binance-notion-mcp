---
name: coin-selection
description: Screen and select Binance futures coins across the entire universe for quick-profit setups. Uses volume, momentum, volatility, and structure filters to rank and pick the best tradable candidates.
---

# Binance Futures Coin Selection

Goal: From all available Binance futures on TradingView, rapidly filter to find coins with the highest probability of a quick, asymmetric move.

---

## Step 1: Discover the Universe

### Get All Binance Futures Symbols

Use `symbol_search` with query targeting Binance futures:

```
symbol_search(query="BINANCE:", type="futures")
```

If this returns limited results, use batch prefix discovery by searching common prefixes:

```
symbol_search(query="1000", type="futures")   # 1000PEPE, 1000SHIB, etc.
symbol_search(query="BTC", type="futures")    # BTCUSDT
symbol_search(query="ETH", type="futures")    # ETHUSDT
```

**Known Binance futures prefixes** (manually construct the full list):
- Majors: `BINANCE:BTCUSDT`, `BINANCE:ETHUSDT`, `BINANCE:BNBUSDT`, `BINANCE:SOLUSDT`, `BINANCE:XRPUSDT`
- Large caps: `BINANCE:ADAUSDT`, `BINANCE:DOGEUSDT`, `BINANCE:AVAXUSDT`, `BINANCE:DOTUSDT`, `BINANCE:LINKUSDT`, `BINANCE:MATICUSDT`, `BINANCE:UNIUSDT`, `BINANCE:SHIBUSDT`, `BINANCE:ATOMUSDT`, `BINANCE:ETCUSDT`, `BINANCE:XLMUSDT`, `BINANCE:TRXUSDT`
- Mid caps: `BINANCE:NEARUSDT`, `BINANCE:APTUSDT`, `BINANCE:OPUSDT`, `BINANCE:ARBUSDT`, `BINANCE:SUIUSDT`, `BINANCE:SEIUSDT`, `BINANCE:TIAUSDT`, `BINANCE:INJUSDT`, `BINANCE:FETUSDT`, `BINANCE:AGIXUSDT`, `BINANCE:PEPEUSDT`, `BINANCE:WIFUSDT`, `BINANCE:DOGSUSDT`
- High beta: `BINANCE:1000PEPEUSDT`, `BINANCE:1000SHIBUSDT`, `BINANCE:1000FLOKIUSDT`, `BINANCE:1000BONKUSDT`, `BINANCE:1000XECUSDT`
- Perpetuals with USDT pairs (standard: `BINANCE:SYMBOLUSDT`)

**Expected count**: 100-200+ tradable USDT perpetual futures pairs on Binance.

### Build the Master List

Compile a flat array of all discovered symbols:

```
const ALL_COINS = ["BINANCE:BTCUSDT", "BINANCE:ETHUSDT", ...]
```

---

## Step 2: First-Pass Screening (Volume + Volatility)

Run a rapid scan across ALL coins on the **1H or 4H timeframe** using `batch_run` with `action: "get_ohlcv"` and `count: 20`:

```
batch_run(symbols: ALL_COINS, timeframes: ["240"], action: "get_ohlcv", ohlcv_count: 20)
```

For each symbol, extract and calculate:
- **avg_volume**: Average volume per bar
- **range_pct**: (high - low) / close × 100 over the period
- **change_pct**: Direction and magnitude of the move
- **last_close**: Latest closing price

### Screening Filters (Pass 1)

Apply these filters in order. Each filter narrows the list by roughly 50%.

| Filter | Criteria | Why |
|--------|----------|-----|
| **Volume Floor** | avg_volume > $10M (or your threshold) | No liquidity = no trade. Slippage kills quick profits. |
| **Volatility Floor** | range_pct > 3% over 20 bars | Need enough movement for quick profits. Dead coins are worthless. |
| **Momentum** | abs(change_pct) > 2% | Must be moving. Flat coins don't produce quick trades. |
| **Directionality** | Change must align with HTF trend OR show reversal setup | Trending or reversing — nothing in the middle. |

**Kill criteria**: If fewer than 5 coins survive the volume floor, lower the threshold. If more than 30 survive, tighten it.

---

## Step 3: Second-Pass Deep Analysis (Shortlist)

Take the surviving coins (ideally 5-15) and run a full analysis pass on each.

For each coin:
1. `chart_set_symbol` + `chart_set_timeframe("240")` — set to 4H
2. `chart_manage_indicator` — add "Volume", "VWAP"
3. `chart_manage_indicator` — add "Moving Average Exponential" (50)
4. `chart_manage_indicator` — add "Average True Range"
5. `data_get_ohlcv(count: 30, summary: true)` — get price structure
6. `data_get_study_values` — get indicator readings
7. `quote_get` — current price

### Scoring Matrix (Pass 2)

Score each coin from -3 to +3 on every criterion:

| Criterion | -3 | -2 | -1 | 0 | +1 | +2 | +3 |
|-----------|-----|-----|-----|-----|-----|-----|-----|
| **Trend** | Strong downtrend | Downtrend | Weak downtrend | Ranging | Weak uptrend | Uptrend | Strong uptrend |
| **Volume** | Dead (near 0) | Very low | Below avg | Average | Above avg | High | Massive |
| **Volatility (ATR%)** | < 1% | 1-2% | 2-3% | 3-4% | 4-6% | 6-10% | > 10% |
| **RSI** | > 80 (overbought) | 70-80 | 60-70 | 40-60 | 30-40 | 20-30 | < 20 (oversold) |
| **Proximity to EMA** | Far below | Below | Near below | At EMA | Near above | Above | Far above |
| **Price vs VWAP** | Far below VWAP | Below VWAP | Slightly below | At VWAP | Slightly above | Above VWAP | Far above VWAP |
| **Structure** | Clear breakdown | BOS bearish | Bearish bias | Neutral | Bullish bias | BOS bullish | Breakout with vol |

### Quick-Profit Weighting

For *quick profits*, weight these criteria higher:
- **Volume**: 3× weight (without volume, you can't enter/exit fast)
- **Volatility**: 2× weight (more movement in less time)
- **Trend strength**: 2× weight (trending = easier to capture)

### Rank Calculation

```
Score = (Trend × 2) + (Volume × 3) + (ATR% × 2) + RSI + Proximity + (Price vs VWAP) + (Structure × 2)
Max possible: (3×2) + (3×3) + (3×2) + 3 + 3 + 3 + (3×2) = 6 + 9 + 6 + 3 + 3 + 3 + 6 = 36
```

**Top picks**: Score > 20
**Watch list**: Score 10-20
**Skip**: Score < 10

---

## Step 4: Pattern Recognition (Visual Confirmation)

For the top 3-5 ranked coins, take screenshots and visually confirm:

```
capture_screenshot(region: "chart")
```

Look for:

**Bullish quick-profit patterns:**
- Bull flag / pennant after a volume impulse
- Pullback to EMA/VWAP on declining volume (VCP)
- Hidden bullish divergence on RSI (highest conviction)
- Breakout above resistance with volume

**Bearish quick-profit patterns:**
- Bear flag after a volume sell-off
- Rejection at resistance with long upper wick
- Hidden bearish divergence on RSI
- Breakdown below support with volume

**Avoid:**
- Wide-ranging, directionless candles (no edge)
- Doji / indecision clusters (no conviction)
- Low-volume drift (no fuel)
- Coins that just printed a massive move (+15%+ in one go) — exhaustion likely

---

## Step 5: Final Selection & Report

### Top Pick Summary

```
## Coin Selection Report

### Universe
Total coins scanned: [X]
Passed volume filter: [X]
Passed volatility filter: [X]
Passed momentum filter: [X]
Deep analysis: [X]

### Ranked Shortlist
| Rank | Symbol | Score | Setup | Entry Zone | R:R |
|------|--------|-------|-------|-----------|-----|
| 1 | BTCUSDT | 28/36 | Bull flag | $XX,XXX | 3.2:1 |
| 2 | SOLUSDT | 25/36 | VCP pullback | $XXX | 4.1:1 |
| 3 | PEPEUSDT | 22/36 | Hidden bull div | $0.XXXX | 5.0:1 |

### Top Pick Analysis
[Detailed chart-analysis using chart-analysis skill]

### Watchlist
Add the top picks to the TradingView watchlist:
watchlist_add(symbol: "BINANCE:SOLUSDT")
watchlist_add(symbol: "BINANCE:1000PEPEUSDT")
```

### Key Decision Rules for Quick Profits

| Condition | Action |
|-----------|--------|
| Score > 20 + clear bull flag | **Full size. Quick scalp to +2R.** |
| Score > 20 + pullback to demand | **Full size limit order at zone. Wide stop.** |
| Score 15-20 + RSI divergence | **Half size. Let it develop.** |
| Score < 15 or no clear pattern | **Pass. There will be 20+ coins again tomorrow.** |

### Time Management

- **Full scan (100+ coins)**: ~15-20 minutes with batch processing
- **Shortlist scan (15 coins)**: ~10 minutes of detailed analysis
- **Top 3 deep dive + chart-analysis**: ~10 minutes per coin
- **Total time**: ~45 minutes for a complete daily scan

**For quick daily scans**: Use the watchlist. Coins that made the cut yesterday and are still active get rechecked first. Only scan the full universe weekly.

---

## Step 6: Handoff to Chart-Analysis

For the final selected coin(s), run the chart-analysis skill to produce the full legendary trader decision log with:
- Regime detection
- Asymmetry scan
- Confluence checklist
- Position sizing
- Entry/stop/TP levels
- Annotated chart screenshot

---

## Efficiency Shortcuts

### Tier 1 — Always Scan (10 coins)
These are the most liquid, most volatile, and most consistently tradable:
BTC, ETH, SOL, XRP, DOGE, PEPE, WIF, BONK, SUI, AVAX

### Tier 2 — Watchlist (20 coins)
Run these when Tier 1 has no clear setups:
ADA, DOT, LINK, AVAX, NEAR, APT, OP, ARB, INJ, FET, SEI, TIA, ATOM, UNI, ETC, XLM, TRX, SHIB, FLOKI, DOGS

### Tier 3 — Full Universe (rest)
Scan weekly or when market conditions change dramatically (BTC breaks range, etc.).
