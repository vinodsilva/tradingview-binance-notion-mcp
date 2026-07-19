# Research Context

This project explores an open question in human-AI collaboration: **how can LLM-based agents interact with professional financial desktop applications to support human decision-making?**

## Motivation

Agent-augmented trading represents an emerging paradigm where LLM agents assist — but do not replace — human traders. The Model Context Protocol (MCP) provides a standardized way for LLMs to interact with external tools. Financial desktop applications like TradingView are among the most complex, stateful, real-time interfaces that exist. Connecting the two raises genuine research questions about agent reliability, context management, and human-AI collaboration that remain under-explored.

This project is not a trading bot. It is an **interface layer** that makes a trading application legible to an LLM agent, allowing researchers and developers to study human-AI collaboration in financial workflows.

---

## Research Questions

### 1. Context Window Constraints

A full chart state with multiple indicators can easily exceed practical context limits. A single Pine Script source file can be 200KB+. OHLCV data for 500 bars approaches 40KB.

**How should agents prioritize what to read?** This project's approach: compact-by-default output (`summary: true`, deduplicated pine graphics, capped labels), with verbose mode as opt-in. The tool design itself encodes a hypothesis about agent-friendly data granularity.

**Key finding:** The most impactful design decision was making all tools return compact output by default. Without this, a typical "analyze my chart" workflow consumes 80KB+ of context. With compact defaults, it's 5-10KB.

### 2. Temporal Consistency

Market data changes continuously. A quote fetched at the start of an agent's reasoning may be stale by the time it responds. Indicator values shift every tick.

**How does an agent reason about data that may be stale by the time it processes it?** What's the practical latency budget for chart-reading workflows?

**Key finding:** When streaming data changes faster than the agent can respond, the agent's reasoning becomes stale. This is a fundamental limitation of request-response LLM architectures operating on real-time data. The practical solution is using streaming for human monitoring (piped to dashboards) rather than agent consumption.

### 3. Tool Granularity

Should an agent have one `read_chart` tool or 104 granular tools? This project chose granularity — separate tools for quote, OHLCV, indicator values, pine lines, pine labels, pine tables, pine boxes, Binance spot/futures trading, Telegram signals, Notion journaling, etc.

**The tradeoff:** Granular tools give the agent precise control and small payloads, but require the agent to know which tool to call (solved via MCP server instructions and a decision-tree config file). A single coarse tool would be simpler but would waste context on unneeded data.

**Key finding:** 104 tools does not confuse the agent. With descriptive tool names and clear instructions, Claude consistently selects the right tools. The key is the instruction block — not reducing tool count.

### 4. Failure Transparency

When an agent misreads a chart — interpreting a label incorrectly, reading stale data, or misunderstanding indicator values — how should it communicate uncertainty?

This project surfaces raw data and lets the agent reason about it, rather than pre-interpreting. This means failures are visible in the agent's reasoning trace rather than hidden behind an abstraction.

### 5. Human-in-the-Loop Design

What decisions should always require explicit human confirmation? Currently, all chart mutations (symbol changes, indicator additions, drawing) are executed immediately. Replay trading is simulated only.

The boundary between "agent acts autonomously" and "agent proposes, human confirms" is a design decision with implications for both usability and safety.

### 6. Multi-Asset Agent Reasoning

When an agent monitors multiple symbols simultaneously (via multi-pane layouts + streaming), how does it reason about cross-asset relationships? Can it identify divergences, correlations, or relative strength from raw OHLCV across 4 panes?

### 7. Indicator Composition Strategy

When defining agent workflows that interact with chart indicators, how should indicators be composed? This project evolved from standalone indicators (separate RSI, Volume indicators) to a combined approach.

**Key decision:** Replace standalone RSI indicator with a "MACD + ATR + RSI" combo indicator for multi-timeframe analysis. The combo provides ATR (volatility context), MACD (trend/momentum), and RSI (overbought/oversold) from a single indicator, reducing the number of studies the agent must query. Volume remains a standalone indicator because it requires SMA20 computation for divergence analysis.

**Per-TF data shape:**
```
indicators: {
  combo: { rsi, macd, macd_signal, macd_histogram, atr },
  volume: { current, sma20, ratio }
}
```

**Key finding:** The combo indicator has a display toggle for RSI (`in_1`). When disabled, RSI values are absent from `data_get_study_values` output. Agents must verify the RSI display is enabled before reading, or call `indicator_set_inputs` to enable it. This is a subtle but critical point — an indicator can be "on the chart" but not returning all its values.

### 8. Agent Orchestration Architecture

Beyond individual tools, how should agents be structured for complex multi-step workflows? This project evolved a two-layer architecture:

- **Agents** (`agents/`): Role definitions that tell the LLM *who to be* and *what skill to use*
- **Skills** (`skills/`): Detailed procedural references that define *how to execute* each workflow

The chart-analyst agent runs a strict 10-stage pipeline — `_setup → _volume → _supply_demand → _structure → _fib → _momentum → _confluence → _sizing → _execution → _report`. Each stage is a separate skill file with its own role definition, inputs, outputs, and edge case handling.

**Agent hierarchy:** Discovery agents (coin-scout, market-scanner) feed into chart-analyst for final grading. The chart-analyst pipeline is the single source of truth for directional trade decisions. All other agents are discovery or support layers.

**Key finding:** Strict pipeline ordering with explicit stage boundaries prevents the agent from skipping steps or hallucinating intermediate results. Each stage's output is the next stage's input, creating a chain of reasoning that can be audited and debugged at any point.

### 9. Pine Script as Agent Output

Can an LLM agent write, debug, and iterate on Pine Script effectively? Pine Script is a domain-specific language with unusual constraints (series types, historical referencing, repainting behavior).

**Key finding:** The compile → error → fix loop is where agent assistance provides the most value. Pine Script has unusual semantics that even experienced programmers struggle with. Having an agent that can read errors, understand the language, and propose fixes significantly accelerates development.

---

## Findings Summary

| Area | Finding |
|------|---------|
| Context management | Compact-by-default outputs reduced workflow context from 80KB to 5-10KB |
| Tool count | 104 tools is manageable with clear naming and instructions |
| Pine Script development | Strongest use case — compile-error-fix loop accelerates iteration |
| Real-time data | Streaming is better for human monitoring than agent consumption |
| Agent reliability | Varies significantly by model and context length |
| Conditional order responses | Binance algo order endpoints return `algoId`/`algoStatus` not `orderId`/`status` — tool must handle both response shapes |

---

### 10. Conditional Order API Divergence

Binance Futures uses separate REST endpoints for regular orders (`/fapi/v1/order`) and conditional/stop orders (`/fapi/v1/algoOrder`). These endpoints return structurally different response payloads — regular orders return `orderId`/`status`, while conditional orders return `algoId`/`algoStatus`.

**Key finding:** The `binance-api-node` library routes all order types through a single `futuresOrder()` method but the response shape depends on the order type. Initial tool code only extracted `orderId` and `status`, making conditional orders appear to fail when they actually succeeded. This is a classic API abstraction leak.

**Fix applied:** Updated `place_futures_order` to check for both `orderId` and `algoId`, both `status` and `algoStatus`, and both `stopPrice` and `triggerPrice`. Successful conditional orders now properly report their `algoId` and `algoStatus: "NEW"`.

### 11. Conditional Order Visibility

Binance does not expose a GET endpoint to list open conditional/algo orders. The `GET /fapi/v1/algoOpenOrders` returns 404. Only account-level position data and unconditional `GET /fapi/v1/openOrders` are available.

This means **conditional stop/tp orders cannot be programmatically verified** after placement using standard Binance REST API. The only way to confirm they exist is through the TradingView UI or Binance web interface.

**Workaround:** Cancel all orders before re-placing to ensure clean state.

### 12. Notion Trade Journal Integration

Logging trades to a structured database introduces cross-system consistency challenges. When an agent logs a trade to Notion, the trade data must be structurally compatible with the Notion database schema, which has strict column types (Title, Select, Date, Number, Text).

**Key finding:** Schema mismatches between the agent's output and the Notion database cause silent failures — the agent thinks it logged successfully but no entry appears. A `notion_check_schema` tool is essential to verify column compatibility before logging. The workflow is: `notion_check_schema` → `notion_log_trade` (entry) → `notion_update_exit` (close).

The 22-column schema covers: Symbol, Direction, Date, Grade, Win Prob, Setup Type, Entry Price, Stop Loss, TP1-3, RR, Leverage, Conviction, Risk %, Liquidity Quality, Reasons, Exit Price, P&L, P&L %, Result, Exit Reason, Notes.

---

## Limitations

- Depends on undocumented internal TradingView APIs that change without notice
- Binance conditional orders (SL/TP) cannot be queried via REST after placement — only cancelled and re-placed
- Not suitable for production automated trading
- Agent performance varies significantly by model and available context length
- Real-time data introduces fundamental latency challenges for LLM reasoning
- No formal evaluation framework — findings are observational

---

## Related Work

- **Model Context Protocol** — Anthropic (2024). The protocol this project implements for LLM-tool communication.
- **ReAct: Synergizing Reasoning and Acting in Language Models** — Yao et al. (2022). The reasoning-action paradigm that underlies how agents use these tools.
- **FinAgent: A Multimodal Foundation Agent for Financial Trading** — Zhang et al. (2024). Explores LLM agents in financial contexts with multimodal inputs.
- **Toolformer: Language Models Can Teach Themselves to Use Tools** — Schick et al. (2023). Foundational work on LLMs learning to use external tools.
- **FinGPT: Open-Source Financial Large Language Models** — Yang et al. (2023). Open-source LLMs fine-tuned for financial applications.
- **Can Large Language Models Provide Useful Advice on How to Invest?** — Pelster & Val (2024). Studies LLM capability in financial reasoning.
