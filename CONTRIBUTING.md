# Contributing

Thanks for your interest in contributing to TradingView MCP Bridge.

---

## Scope

This project is a **local bridge** between AI agents and the TradingView Desktop app running on your machine. All contributions must stay within this scope.

### ✅ In Scope

- **Reliability improvements**: Better CDP selectors, error handling, timeouts, reconnection logic
- **New tools**: Additional MCP tools that interact with the locally running TradingView Desktop
- **CLI commands**: Mirroring MCP tool capabilities as `tv` CLI commands
- **Bug fixes**: Edge cases, race conditions, data parsing issues
- **Test coverage**: Unit tests, integration tests, edge case coverage
- **Documentation**: README, guides, API references, decision trees
- **Pine Script workflow**: Better compile-error-fix loop, static analysis enhancements
- **UI automation**: Reliable selectors for TradingView's Electron interface

### ❌ Out of Scope

Contributions **must not**:

- **Connect directly to TradingView's servers** — all data access must go through the locally running Desktop app via CDP
- **Bypass authentication or subscription restrictions** — requires a valid TradingView account and subscription
- **Scrape, cache, or redistribute market data** — no data storage, no databases, no export of price data
- **Enable automated trading or order execution** — this is a chart analysis tool, not a trading bot
- **Reverse-engineer or redistribute TradingView's proprietary code** — no bundled TradingView source
- **Access other users' data** — private scripts, watchlists, or account information of others
- **Add cloud services or external dependencies** — keep it local and self-contained

If unsure, open an issue to discuss before submitting a PR.

---

## Development

```bash
# Install dependencies
npm install

# Run tests (offline — no TradingView needed)
npm test

# Verify CDP connection (TradingView must be running with debug port)
node src/cli/index.js status
```

---

## Pull Request Guidelines

1. **One feature per PR** — keep changes focused and reviewable
2. **Add tests** for new functionality where possible
3. **Pass tests** — `npm test` should pass
4. **Test live** — verify against a real TradingView Desktop instance before submitting
5. **Self-review** — check for edge cases, error handling, and context bloat

### Code Style

- The project uses ES modules (`"type": "module"` in package.json)
- Follow existing patterns in the codebase (error handling, logging, response format)
- All MCP tools return `{ success: true/false, ... }`
- Keep tool output compact by default; use `verbose` parameter for detailed data

### Commit Messages

Clear, descriptive commit messages in present tense:

```
Add support for custom timeframe intervals
Fix race condition in replay_step tool
Update dependency to fix CDP timeout issue
```

---

## Testing

```bash
# Run all tests
npm test

# Run E2E tests (requires live TradingView)
node --test tests/e2e.test.js
```

Tests that require a live TradingView connection will be skipped if CDP is unavailable.

---

## Documentation

If you add a new tool or change existing behavior:

- Update the tool description in the source code (shown to the AI agent)
- Update [`CLAUDE.md`](CLAUDE.md) if the decision tree changes
- Update [`README.md`](README.md) tool reference tables
- Keep output size estimates accurate

---

## Questions?

Open a [GitHub Issue](https://github.com/vinod99/tradingview-mcp/issues) for:
- Feature requests and discussions
- Bug reports with reproduction steps
- Clarification on scope or design decisions
