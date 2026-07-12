---
name: multi-symbol-scan
description: Iterative scan that cycles through candidates until a tradeable grade-A or grade-B setup is found. Expands universe and changes timeframes on each pass.
---

# Multi-Symbol Scanner — Iterative Until Grade Found

You scan multiple symbols for trading setups. If no A/B grade is found, you expand the scan and try again. You only stop when you have a tradeable setup or exhaust all escalation paths.

## Scan Loop

### Pass 1: Markov Scan (Crypto) / Quick Scan (Futures)

**Crypto:** Use `coin_scan` with the top 20 Binance USDT pairs by volume:
- `timeframe`: 240, `htf`: D, `bars`: 30, `volume_min`: 5, `top_n`: 10

**Futures/Stocks:** Use `batch_run` with `get_ohlcv` across symbols:
- Sort by range %, volume spike, RSI divergence, or momentum persistence

From the top results, run **chart-analysis** (skills/chart-analysis/SKILL.md) on the top 1-3 candidates. This means multi-TF data acquisition → volume analysis → S/D zones → structure → fib → momentum → confluence scoring → decision grade.

**Pass criteria:** Any candidate grades A or B → stop, execute, report.

### Pass 2: Expand Universe

If Pass 1 yields no A/B grade:
- **Crypto:** Increase to top 40 coins (lower volume_min to 2M), or change the entry timeframe (try 60 instead of 240, or D instead of 4H)
- **Futures:** Switch to different sectors (commodities, rates, FX) or different timeframe
- Run `coin_scan` again or manual analysis with the new parameters
- Check `watchlist_get()` for existing user watchlist symbols

### Pass 3: Change Timeframe Context

If still no grade:
- Run coin selection with inverted HTF/TF — if you tried 4H/D, try 60/240 or D/W
- Look for reversal setups instead of momentum (oversold bounces, HTF sweep + displacement)
- Scan for grade-B setups that could become grade-A with a catalyst
- Use chart-analysis pipeline directly on major indices / correlated assets

### Pass 4: Broaden Market Scope

If all crypto passes yield nothing:
- Switch markets entirely — scan futures (ES, NQ, CL, GC), major FX pairs, or top stocks
- Use `symbol_search(type: "stock", query: "NYSE")` or `symbol_search(type: "futures", query: "")` to discover symbols
- For futures, check: ES1!, NQ1!, YM1!, RTY1!, CL1!, NG1!, GC1!, SI1!, HG1!, ZB1!, ZF1!, 6E1!, 6J1!
- Run `coin_scan` or manual analysis on new universe

### Pass 5: Report No-Trade

If all passes yield nothing:
- Produce a "No Trade" report summarizing what was scanned, why no setup exists
- Note market regime (compression, low volatility holiday, directionless ranging)
- Flag any watchlist items or levels worth monitoring

## Grading (via chart-analysis)

Grades come from **chart-analysis** (`skills/chart-analysis/_confluence.md`) — the full 10-stage pipeline: setup → volume → S/D zones → structure → fib → momentum → confluence scoring (EV model) → sizing → execution → report.

Every candidate must pass through chart-analysis to receive a grade. The Markov scan filters candidates but does NOT replace chart-analysis grading.

Only stop the scan loop when chart-analysis returns:
- ✅ **Grade A+** (75-85% EV): EXECUTE immediately
- ✅ **Grade A** (65-75% EV): EXECUTE
- ✅ **Grade B** (55-65% EV): EXECUTE if no better alternative after full scan
- ⏳ **Grade B-** or lower: Keep scanning — flag best find but continue loop

## Output per Pass

```
## Scan Pass [N]
Universe: [X] symbols | Entry TF: [240] | HTF: [D]
Candidates found: [X] | A-grade: [0] | B-grade: [1] | C/below: [X]
Best find: [SYMBOL] — Grade [X] — Direction [X] — Key levels

Next action: Continue scanning / Execute best find / Report no-trade
```
