---
name: _setup
description: Chart initialization, style selection, session context, indicator setup, data collection
---

# Setup — Initialization & Context

## Dependencies
None. This is the entry point.

## Inputs
- (optional) User-specified style: "scalp" or "swing"
- (optional) User-specified symbol

## Steps

### 1. Style Selection

| Dimension | Scalping | Swing |
|-----------|----------|-------|
| Hold time | Seconds to hours | Days to weeks |
| Core TFs (FX/Equities) | 15, 5, 1 | W, D, 4H, 60 |
| Core TFs (Crypto) | 15, 5, 1 | D, 12H, 4H, 60 (alts); W, D, 12H, 4H (BTC) |
| Entry TFs | 5, 1 | 60, 15 |
| Stop width | 0.2-0.5 ATR | 1.0-2.0 ATR |
| Target type | Fixed price levels | Structure-based levels |
| Primary edge | Order flow + session timing | HTF structure + volume |
| Volume requirement | Tick volume + DOM imbalance | Bar volume deltas |
| Session dependency | High (only trade active sessions) | Low (any time) |

**Crypto TF note:** 12H and 8H are standard on crypto exchanges and replace missing TF coverage. 12H bridges D→4H gap for swing. 8H aligns with funding settlement cycles.

**If undecided:** default to swing. Scalping requires live DOM and sub-minute data.

### 2. Session Clock

| Session | Hours (EST) | Liquidity | Best For |
|---------|-------------|-----------|----------|
| **Asia** | 7 PM - 3 AM | Low | Range trading only |
| **London Open** | 3 AM - 4 AM | High (surge) | Breakouts, direction change |
| **London** | 4 AM - 7 AM | Medium | Trend continuation |
| **London/NY Overlap** | 7 AM - 12 PM | **Highest** | **Best scalping window** |
| **NY Open** | 9:30 AM - 10 AM | High (volatility spike) | Post-news direction |
| **NY Afternoon** | 12 PM - 4 PM | Medium | Range consolidation |
| **NY Close** | 4 PM - 5 PM | Medium | Position squaring |

#### Crypto 24/7 Session Clock

Crypto trades 24/7 but volume is NOT uniform. Perpetual futures volume follows global liquidity centers:

| Session | Hours (UTC) | Liquidity | Volatility | Best For |
|---------|-------------|-----------|------------|----------|
| **Asia AM** | 0:00 - 6:00 UTC | Low-Med | Low (0.5-1% BTC hourly) | Range trading. Accumulation zones. |
| **Asia PM / EU open** | 6:00 - 12:00 UTC | Medium | Increasing | Early direction. Trend starts here. |
| **EU / London** | 12:00 - 16:00 UTC | High | Medium-High | **Best for BTC/ETH** |
| **US Pre-open** | 16:00 - 18:00 UTC | High | High | Volatility ramp. News-driven. |
| **US / NY** | 18:00 - 22:00 UTC | **Highest** | **Highest** | **Best scalping window for ALL crypto** |
| **US Late** | 22:00 - 0:00 UTC | Medium | Decreasing | Position squaring. Reversals common. |

**Crypto insight:** 70%+ of volume occurs during US session (12:00 - 22:00 UTC). Scalping outside this window requires wider stops and smaller size.

**If crypto:** use UTC session clock above. **If FX/equities:** use EST session clock above.

### 3. MCP Initialization

```python
chart_get_state()  # Get symbol, TF, entity IDs for all indicators
quote_get()        # Real-time price snapshot
```

### 4. Indicator Setup (Call Once Per Session)

| Indicator | Full Name for MCP | Purpose |
|-----------|------------------|---------|
| Volume | "Volume" | Raw volume bars |
| VWAP | "Volume Weighted Average Price" | Volume-weighted average with std dev bands |
| RSI | "Relative Strength Index" (14 period) | Divergence detection, momentum |
| EMA 20 | "Moving Average Exponential" | Crypto W/12H/8H trend (set length=20 via `inputs`) |
| EMA 50 | "Moving Average Exponential" | Standard trend context (set length=50 via `inputs`) |
| EMA 200 | "Moving Average Exponential" | Major trend context (set length=200 via `inputs`) |
| ATR | "Average True Range" | Volatility sizing, stop placement |

#### Crypto-Specific Indicators (Add If Trading Crypto)

| Indicator | Source | Purpose |
|-----------|--------|---------|
| **BTC Dominance** | TradingView symbol `BTC.D` on D timeframe | Altcoin bias modifier. BTC.D rising = alts underperform. |
| **Funding Rate** | Exchange API (Binance/Bitget perp pages) or Pine Script custom indicator | Positioning heat check. Extreme funding = reversal risk. |
| **Open Interest** | Coinglass/Exchange data or Pine Script custom indicator | Trend health. OI + price confirmation. |
| **Long/Short Ratio** | Exchange API or Pine Script custom indicator | Crowded trade detection. |

### 5. Timeframe Hierarchy & Data Collection

**FX/Equities Swing:** W → D → 4H → 60 → 15
**Crypto Swing (Alts):** D → 12H → 4H → 60 → 15
**Crypto Swing (BTC):** W → D → 12H → 4H → 60
**Scalp (Any asset):** 4H → 60 → 15 → 5 → 1

| TF | Bar Span | Role (FX/Equities) | Role (Crypto) |
|----|----------|--------------------|---------------|
| W | 1 week | Macro liquidity zones, EMA200 trend context | Macro cycle trend. Halving context. |
| D | 1 day | Swing liquidity map, major OB/FVG zones | Medium-term trend. Close at UTC midnight. |
| 12H | 12 hours | Not used | **Crypto bridge TF.** Captures Asia→US cycle. |
| 8H | 8 hours | Not used | **Swing TF.** Aligns with funding settlement. |
| 4H | 4 hours | Primary BOS/CHOCH engine | Primary swing momentum, structure engine. |
| 60 | 1 hour | Session structure, inducement context | Session bias, structure context. |
| 15 | 15 min | Entry timing, liquidity sweeps, FVG detection | Entry timing, liquidity sweeps, FVG detection. |
| 5 | 5 min | Scalp entries, order flow reading | Scalp entries, order flow reading |
| 1 | 1 min | Tick-level entries (scalp only) | Tick-level entries (scalp only) |

**Crypto TF selection logic:**
- If `symbol` is crypto (BTC, ETH, XRP, SOL, etc.) and style is swing: collect 12H and 8H data
- If `symbol == "BTCUSDT"`: collect W data (macro anchor)
- If `symbol` is an altcoin: skip W, use D as the macro anchor
- 12H and 8H are only relevant for swing analysis. Scalping uses 4H→60→15→5→1.

#### FX/Equities Swing Data Path
1. `chart_set_timeframe("W")` → `data_get_ohlcv(count=100, summary=true)` → `data_get_study_values()`
2. `chart_set_timeframe("D")` → repeat
3. `chart_set_timeframe("240")` → repeat
4. `chart_set_timeframe("60")` → repeat
5. `chart_set_timeframe("15")` → repeat

#### Crypto Swing Data Path (Alts)
1. `chart_set_timeframe("D")` → `data_get_ohlcv(count=100, summary=true)` → `data_get_study_values()`
2. `chart_set_timeframe("720")` (12H) → `data_get_ohlcv(count=60, summary=true)` → `data_get_study_values()`
3. `chart_set_timeframe("480")` (8H) → `data_get_ohlcv(count=60, summary=true)` → `data_get_study_values()`
4. `chart_set_timeframe("240")` → repeat
5. `chart_set_timeframe("60")` → repeat
6. `chart_set_timeframe("15")` → repeat

**Note for BTC:** replace step 1 with `chart_set_timeframe("W")` as the macro anchor. BTC uses W→D→12H→4H→60.

#### BTC Anchor Data Collection (For Altcoin Analysis)

If trading an altcoin, collect BTC's TF data alongside the alt's. Switch the chart to BTCUSDT and collect the TFs that the structure module uses for BTC anchor context:

1. `chart_set_symbol("BTCUSDT")`
2. `chart_set_timeframe("D")` → `data_get_ohlcv(count=100, summary=true)` → `data_get_study_values()`
3. `chart_set_timeframe("720")` (12H) → `data_get_ohlcv(count=60, summary=true)` → `data_get_study_values()`
4. `chart_set_timeframe("240")` → `data_get_ohlcv(count=60, summary=true)` → `data_get_study_values()`
5. `chart_set_symbol(original_symbol)` — restore original chart

**BTC anchor data structure:**
```json
"btc_tf_data": {
  "D": { "ohlcv": { ... }, "study_values": { "ema50": 67000, "ema200": 58000 } },
  "12H": { "ohlcv": { ... }, "study_values": { "ema20": 65500 } },
  "4H": { "ohlcv": { ... }, "study_values": { "ema50": 64800, "ema200": 62000 } }
}
```

#### Crypto-Specific Market Data (Funding, OI, Dominance)

Collect if available (via Pine Script custom indicators or exchange APIs):

```python
# BTC.D — switch to BTC.D symbol on D timeframe
chart_set_symbol("BTC.D")
chart_set_timeframe("D")
btc_d = quote_get().last
btc_d_1w_ago = data_get_ohlcv(count=7, summary=True)  # to calc weekly change
chart_set_symbol(original_symbol)

# Funding rate — read from custom indicator or exchange
funding_rate = data_get_pine_labels(study_filter="Funding Rate")  # if pine indicator active
open_interest = data_get_study_values(study_filter="Open Interest")  # if indicator active
long_short_ratio = data_get_pine_tables(study_filter="Long/Short")  # if table available
```

**If data is unavailable (no custom indicator):** pass `null` for the field.

#### Scalp Data Path
1. `chart_set_timeframe("240")` → `data_get_ohlcv(count=50, summary=true)`
2. `chart_set_timeframe("60")` → `data_get_ohlcv(count=24, summary=true)`
3. `chart_set_timeframe("15")` → `data_get_ohlcv(count=20, summary=false)`
4. `chart_set_timeframe("5")` → `data_get_ohlcv(count=12, summary=false)`
5. `depth_get()` — DOM snapshot

### 6. Data Freshness Rules (Scalping)

| Data Point | Max Age | If Stale |
|------------|---------|----------|
| OHLCV (entry TF) | 2 bars | Re-fetch |
| DOM snapshot | 5 seconds | Re-fetch |
| Quote (last price) | 1 second | Re-fetch |
| Indicator values | 3 bars | Re-fetch |
| Pine labels/lines | 5 bars | Re-fetch |

For swing, multiply limits by 10x.

### 7. Indicator Name Reference

| Short Name | Full Name for MCP |
|-----------|------------------|
| RSI | Relative Strength Index |
| EMA | Moving Average Exponential |
| SMA | Moving Average |
| VWAP | Volume Weighted Average Price |
| BB | Bollinger Bands |
| MACD | MACD |
| ATR | Average True Range |

### 8. Indicator Template — Complete Pipeline Reference

#### Setup Indicator Configuration (chart_manage_indicator)

| Indicator | MCP Full Name | Inputs | TFs | Consumed By |
|-----------|--------------|--------|-----|-------------|
| Volume | "Volume" | default | All | `_volume` (bar types, divergence), `_structure` (sweep vol) |
| VWAP | "Volume Weighted Average Price" | default | Entry TF | `_structure` (liquidity zones) |
| RSI | "Relative Strength Index" | length=14 | All | `_volume` (divergence), `_confluence` (RSI regime) |
| EMA 50 | "Moving Average Exponential" | length=50 | All TFs | `_structure` (BOS/CHOCH trend context) |
| EMA 200 | "Moving Average Exponential" | length=200 | W, D, 4H | `_structure` (macro trend), `_confluence` (turtle filter) |
| ATR | "Average True Range" | length=14 | Entry TF | `_sizing` (stop distance), `_volume` (bar classification) |

#### Crypto-Specific Pine Indicators (Optional)

| Indicator | Data Source | Data Type | Consumed By |
|-----------|------------|-----------|-------------|
| Funding Rate | Pine custom indicator / exchange API | `data_get_pine_labels` | `_setup` (crypto context) |
| Open Interest | Pine custom indicator / exchange API | `data_get_study_values` | `_setup` (crypto context) |
| Long/Short Ratio | Pine custom indicator / exchange API | `data_get_pine_tables` | `_setup` (crypto context) |
| BTC.D | TradingView symbol "BTC.D" on D | `quote_get` + OHLCV | `_setup` (altcoin bias modifier) |

#### Full Indicator Recipe — All TFs (Swing)

| TF | OHLCV Count | Indicators Needed | Purpose |
|----|------------|-------------------|---------|
| W | 100 (summary) | Volume, RSI, EMA50, EMA200, ATR | Macro liquidity zones, EMA200 trend, Wyckoff phases |
| D | 100 (summary) | Volume, RSI, EMA50, EMA200, ATR | Medium-term OB/FVG zones, swing liquidity |
| 12H | 60 (summary) | Volume, RSI, EMA50, ATR | Crypto bridge TF, Asia→US cycle |
| 8H | 60 (summary) | Volume, RSI, ATR | Funding settlement cycles, swing TF |
| 4H | 100 (summary) | Volume, RSI, EMA50, EMA200, ATR | Primary BOS/CHOCH, Structure Engine |
| 60 | 100 (summary) | Volume, RSI, EMA50, ATR | Session structure, inducement context |
| 15 | 100 (summary=false) | Volume, RSI, EMA50, VWAP, ATR | Entry timing, liquidity sweeps, FVG detection |

#### Full Indicator Recipe — All TFs (Scalp)

| TF | OHLCV Count | Indicators Needed | Purpose |
|----|------------|-------------------|---------|
| 4H | 50 (summary) | Volume, RSI, EMA50, EMA200, ATR | Context, major SR zones |
| 60 | 24 (summary) | Volume, RSI, EMA50, ATR | Session structure, engine phase |
| 15 | 20 (summary=false) | Volume, RSI, VWAP, ATR | Entry TF, sweeps, FVG detection, RSI divergence |
| 5 | 12 (summary=false) | Volume, RSI, ATR | Scalp timing, S1-S6 bar types |
| 1 | 0 (DOM only) | None | Tick-level entries, depth_get() for DOM |

#### Data Collection Order Template

```
# Swing (FX/Equities):
W → D → 4H → 60 → 15
# Each TF: chart_set_timeframe → data_get_ohlcv → data_get_study_values

# Swing (Crypto Alts):
D → 720(12H) → 480(8H) → 240 → 60 → 15

# Swing (Crypto BTC):
W → D → 720(12H) → 240 → 60

# Scalp (Any):
240 → 60 → 15 → 5 (→ depth_get)
```

## Workflow Pipeline

```
_setup (entry)
  ├──→ _volume (VSA bar classification, RSI divergence)
  ├──→ _structure (liquidity, sweeps, SMC zones, inducement, Wyckoff, EW)
  └──→ _orderflow (DOM analysis — scalp only, standalone)

_volume ──→ _structure (volume confirmation layer)
_structure + _volume + _orderflow ──→ _confluence (scoring & conviction)
_confluence ──→ _sizing (position sizing & R:R)
_sizing ──→ _execution (entry, management, exit)
_execution ──→ _report (journal, edge tracking)
```

## Output

```
{
  "style": "scalp" | "swing",
  "session": { "name": "London/NY Overlap", "hours": "7 AM - 12 PM EST", "liquidity": "high" },
  "entity_ids": { "volume": "abc123", "vwap": "def456", "rsi": "...", "ema50": "...", "ema200": "...", "atr": "..." },
  "current_price": 1.2350,
  "symbol": "XRPUSDT",
  "is_crypto": true | false,
  "tf_data": {
    "W": { ohlcv_summary, study_values },
    "D": { ohlcv_summary, study_values },
    "12H": { ohlcv_summary, study_values },
    "8H": { ohlcv_summary, study_values },
    "4H": { ohlcv_summary, study_values },
    "60": { ohlcv_summary, study_values },
    "15": { ohlcv_summary, study_values }
  },

  "funding_rate": 0.01 | null,                   // crypto perp funding (8h %)
  "open_interest": 1250000000 | null,             // crypto OI in USD
  "btc_dominance": 55.2 | null,                   // BTC.D % (crypto only)
  "long_short_ratio": 1.25 | null,                // L/S ratio (crypto perp)
  "btc_tf_data": { ... } | null,                  // BTC anchor TFs for alt analysis
  "dom": { bids: [...], asks: [...] }             // scalp only
}
```

## Next Module
Pass `{ style, session, entity_ids, current_price, symbol, is_crypto, tf_data, btc_tf_data, funding_rate, open_interest, btc_dominance, long_short_ratio, dom }` → `_volume`, `_structure`
