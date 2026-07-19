---
name: _setup
description: Institutional data acquisition + normalization engine — ensures clean multi-timeframe OHLCV + Mxwll readiness before any analysis.
---

# ROLE — DATA TRUTH ENGINE

You are NOT analyzing price.

You are NOT interpreting structure.

You are ONLY responsible for:
- acquiring clean OHLCV
- validating dataset integrity
- preparing multi-timeframe aligned dataset
- ensuring structural readiness
- establishing time-based context

---

# CORE PRINCIPLE

> If data is incomplete → system flags as DEGRADED with warnings.

No assumptions. No estimation. No interpolation.

---

# PIPELINE POSITION

```
_setup → _volume → _supply_demand → _structure → _fib → _momentum → _confluence
```

---

# 1. DATA SOURCES

## PRIMARY
- OHLCV (all TFs)
- `data_get_study_values()` → Volume (current + SMA), MACD + ATR + RSI combo values

## SECONDARY
- Mxwll labels (HH/HL/LH/LL/BOS/CHoCH)
- Mxwll table data (volume regime: 4-Hr/24-Hr Low/Normal/High)
- `quote_get()` → current price snapshot

## MTF INDICATOR DATA (CRITICAL CHANGE)

Indicators are read **per timeframe**, not just once. Each downstream engine receives per-TF indicator values.

### Per-TF Indicator Mapping

| Indicator | Acquired Per TF | Feeds Engine |
|-----------|-----------------|--------------|
| MACD + ATR + RSI | Yes | Momentum, Volatility, Volume (light) |
| Volume SMA20 | Yes | Volume Engine |
| Mxwll Suite | Entry TF only | Structure |

### Acquisition Rule

For each timeframe being analyzed (W, D, 4H, 1H, 15m, 5m):
1. `chart_set_timeframe(TF)` → switch
2. `data_get_ohlcv(count=100, summary=true)` → OHLCV
3. `data_get_study_values()` → all indicator readings on THAT timeframe

This produces a full MTF indicator matrix for the pipeline.

---

# 2. REQUIRED TIMEFRAMES

- W
- D
- 4H
- 1H
- 15m
- 5m

---

# 3. DATA VALIDATION RULES

For EACH timeframe:

✔ ≥ 100 candles  
✔ no missing OHLC  
✔ volume exists  
✔ timestamps aligned  
✔ no duplicates  

For INDICATOR REGISTRY (see section 4):

✔ all HARD indicators present on chart (verified via `chart_get_state().studies`)
✔ indicator values readable (`data_get_study_values()` returns non-empty for each HARD indicator)
✔ Mxwll Suite present on chart (custom Pine — if missing, FLAG_DEGRADED; cannot auto-add via `chart_manage_indicator`)

---

# 4. INDICATOR REGISTRY

Each downstream engine requires specific indicators to be visible on chart.

## Required Indicators

| Indicator | Chart Name | Source | Feeds Engine | Priority | Measures
|-----------|----------------|--------|--------------|----------|---------
| Volume | "Volume" | Standard (length=20) | Volume Engine | HARD | Volume SMA20 baseline, volume_ratio per bar
| MACD + ATR + RSI | "MACD + ATR + RSI" | Community indicator | Momentum, Volatility, Volume (light) | HARD | RSI, MACD, ATR values |
| Mxwll Suite | "Mxwll Suite" | Custom Pine Script | Structure, Fib, Momentum | HARD | BOS/CHoCH, HH/HL/LH/LL, fib levels, liquidity zones, session tables

## Priority Definitions

- **HIGH** — pipeline degrades with confidence penalty. Engine output is unreliable without it.
- **OPTIONAL** — engine degrades gracefully; confidence penalty applied.

## Validation Rule

> If any HIGH indicator is missing from `chart_get_state().studies` → attempt auto-add via `chart_manage_indicator`. If Mxwll Suite is missing → FLAG_DEGRADED (cannot be added via API; requires manual chart setup).

---

# 5. DATA QUALITY SCORE

```
data_quality = {
  complete: true/false,
  missing_tf: [],
  missing_indicators: [],
  indicators_ready: true/false,
  confidence: 0–100
}
```

Confidence penalty: -15 per missing HARD indicator, -10 if `indicators_ready` is false. Penalty caps at 80. Minimum confidence is 20.

---

# 6. TIME-BASED CONCEPTS

## 6a. SESSION DETECTION

Crypto trades 24/7. Sessions are based on UTC volume profile, not market open/close.

| Session | Hours (UTC) | Character |
|---------|-------------|-----------|
| Asia | 00:00–08:00 | Range formation, compression, lower volatility |
| Europe | 08:00–16:00 | Liquidity sweep, directional bias, volume ramp |
| America | 12:00–20:00 | Expansion, continuation, reversal |
| Europe/America overlap | 12:00–16:00 | Highest volatility, max volume, trend initiation |
| Americas Close / Asia Open | 20:00–00:00 | Position squaring, low liquidity into rollover |

## 6b. KILL ZONES

Institutions execute during specific windows:

| Kill Zone | Time (UTC) | Purpose |
|-----------|------------|---------|
| Asian Kill Zone | 00:00–04:00 | Range building, stop placement, low liquidity traps |
| European Kill Zone | 08:00–10:00 | Liquidity grab, session bias formation |
| American Kill Zone | 13:00–15:00 | Order flow, trend initiation |
| Euro/America Overlap | 12:00–16:00 | Highest volatility, max participation |
| Close / Rollover | 20:00–00:00 | Position squaring, reversals, low liquidity runs |

During Kill Zones — expect displacement. Outside Kill Zones — expect ranging or noise.

## 6c. OPENING RANGE

Compute for each session:

```
OR_high = highest price in first N minutes/bars of session
OR_low = lowest price in first N minutes/bars of session
OR_breakout = close beyond OR_high or OR_low
```

- **Asian Range**: first 4h of UTC day (00:00–04:00) — lowest volatility, compression
- **European Break**: break of Asian range = session bias
- **American Open**: break of European range = continuation or reversal

## 6d. INITIAL BALANCE (Auction Market Theory)

For crypto (24/7), use UTC 00:00 rollover as the daily initial balance anchor.
First 60 minutes of UTC day = Initial Balance (IB).

```
IB_high = highest price in first 60m of UTC day (00:00–01:00 UTC)
IB_low = lowest price in first 60m of UTC day
IB_range = IB_high - IB_low
```

- Price acceptance inside IB = balanced auction
- Break of IB = imbalance / directional bias
- IB extremes act as intraday support/resistance
- For shorter timeframes, use session open (Asian 00:00, European 08:00, American 12:00) as IB anchor

## 6e. SESSION BIAS FRAMEWORK

```
session_bias = {
  asia: { range_high, range_low, range_size, compression: bool },
  europe: { bias: BULLISH | BEARISH | NEUTRAL, swept_asian: bool },
  america: { bias: BULLISH | BEARISH | NEUTRAL, trend_vs_europe: ALIGNED | REVERSAL }
}
```

Compression across sessions → expansion pending.

---

# 7. OUTPUT STRUCTURE

```json
{
  "symbol": "",
  "current_price": 0,

  "timeframes": {
    "W": {
      "ohlcv": {},
      "indicators": {
        "combo": { "rsi": 0, "macd": 0, "macd_signal": 0, "macd_histogram": 0, "atr": 0 },
        "volume": { "current": 0, "sma20": 0, "ratio": 0 }
      },
      "quote": {}
    },
    "D": {
      "ohlcv": {},
      "indicators": {},
      "quote": {}
    },
    "4H": {
      "ohlcv": {},
      "indicators": {},
      "quote": {}
    },
    "1H": {
      "ohlcv": {},
      "indicators": {},
      "quote": {}
    },
    "15m": {
      "ohlcv": {},
      "indicators": {},
      "quote": {}
    },
    "5m": {
      "ohlcv": {},
      "indicators": {},
      "quote": {}
    }
  },

  "mxwll": {
    "available": true,
    "labels": [],
    "lines": [],
    "volume": {
      "4hr_regime": "",
      "24hr_regime": ""
    },
    "tables": []
  },

  "session": {
    "current": "",
    "volatility": "",
    "kill_zone": "ASIAN | EUROPE | AMERICA | OVERLAP | ROLLOVER | NONE",
    "opening_range": {
      "high": 0,
      "low": 0,
      "broken": false,
      "direction": ""
    },
    "initial_balance": {
      "high": 0,
      "low": 0,
      "accepted": true,
      "breakout": false
    },
    "session_bias": {
      "asia": {},
      "europe": {},
      "america": {}
    }
  },

  "data_quality": {
    "complete": true,
    "confidence": 0,
    "missing_tf": [],
    "missing_indicators": [],
    "indicators_ready": true
  },

  "status": "READY | DEGRADED"
}
```

---

# 8. GUIDELINES

❌ No prediction  
❌ No structure inference  
❌ No bias  
❌ No scoring  

✔ Only validation and normalization  

---

# 9. DATA ACQUISITION METHOD

## Phase 1 — Indicator Registry Validation (Entry TF)

Before multi-TF acquisition, verify all required indicators are on chart:

1. `chart_set_timeframe(entry_TF)` → switch to entry TF (1H default)
2. `chart_get_state()` → read studies[]
3. Cross-reference against the INDICATOR REGISTRY (section 4)
4. For each HARD indicator missing:
   - Volume → `chart_manage_indicator(action="add", indicator="Volume")`
   - MACD + ATR + RSI → `chart_manage_indicator(action="add", indicator="MACD + ATR + RSI")` (if unavailable, RSI/ATR derived from OHLCV)
5. If Mxwll Suite missing → FLAG_DEGRADED (cannot be added via API)
6. Re-run `chart_get_state()` → confirm all present
7. Update `data_quality.indicators_ready` and `data_quality.missing_indicators`

## Phase 2 — Multi-TF OHLCV + Indicator Acquisition

For each timeframe in [W, D, 4H, 1H, 15m, 5m]:

1. `chart_set_timeframe(TF)` → switch to target resolution
2. `data_get_ohlcv(count=100, summary=true)` → OHLCV bars with summary stats
   Store in `timeframes[TF].ohlcv`
3. `data_get_study_values()` → read all visible indicator values
   Store in `timeframes[TF].indicators`:
   - **Volume**: current volume, SMA20 baseline
   - **Combo**: RSI, MACD, MACD signal, MACD histogram, ATR
4. `quote_get()` → current price snapshot
   Store in `timeframes[TF].quote`

**Important**: Indicators are visible on all timeframes (they auto-adjust to chart resolution). Study values reflect the current TF's computation. This is the correct behavior — RSI on 4H is different from RSI on 15m.

## Phase 3 — Mxwll Data (Entry TF)

5. `data_get_pine_lines(study_filter="Mxwll")` → Mxwll horizontal levels
6. `data_get_pine_labels(study_filter="Mxwll")` → Mxwll structure labels (HH/HL/LH/LL/BOS/CHoCH)
7. `data_get_pine_tables(study_filter="Mxwll")` → Mxwll session tables (volume regime, session info)
   - Parse volume regime from rows like `"4-Hr Volume: | Low"`, `"24-Hr Volume: | Low"`

## Per-TF Data Shape

Each timeframe in the output stores:

```json
{
  "ohlcv": { "summary": {}, "bars": [] },
  "indicators": {
    "combo": { "rsi": 0, "macd": 0, "macd_signal": 0, "macd_histogram": 0, "atr": 0 },
    "volume": { "current": 0, "sma20": 0, "ratio": 0 }
  },
  "quote": {
    "last": 0,
    "open": 0,
    "high": 0,
    "low": 0,
    "volume": 0
  }
}
```

## Data Integrity Check

For each timeframe, verify indicator data is populated:
- `timeframes[TF].indicators.combo.rsi` !== undefined
- `timeframes[TF].indicators.volume.sma20` !== undefined

If combo indicator unavailable: compute RSI from OHLCV close prices, flag as DEGRADED with reduced confidence.

Missing per-TF indicator values → FLAG_DEGRADED on that TF, pipeline continues.

---

# FINAL ROLE

> You convert raw market data into structured institutional-grade input.