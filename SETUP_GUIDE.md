# Setup Guide

This guide walks through installing and configuring the TradingView MCP Bridge from scratch.

---

## Prerequisites

- **TradingView Desktop** — installed and logged in with a valid subscription
- **Node.js 18+** — verify with `node --version`
- **Claude Code** or any MCP-compatible AI client

---

## Step 1: Clone and Install

```bash
git clone https://github.com/vinod99/tradingview-mcp.git
cd tradingview-mcp
npm install
```

---

## Step 2: Launch TradingView with Debug Mode

TradingView Desktop must be launched with Chrome DevTools Protocol enabled on port 9222.

### Auto-Launch (Recommended)

If the MCP server is already connected, use the `tv_launch` tool — it auto-detects TradingView on all platforms:

```
Ask your AI: "Launch TradingView with the tv_launch tool"
```

### Manual Launch by Platform

**macOS:**
```bash
/Applications/TradingView.app/Contents/MacOS/TradingView --remote-debugging-port=9222
```

**Windows:**
```bash
%LOCALAPPDATA%\TradingView\TradingView.exe --remote-debugging-port=9222
```

**Linux:**
```bash
/opt/TradingView/tradingview --remote-debugging-port=9222
```

### Scripts

Platform-specific launch scripts are included:

```bash
# macOS
./scripts/launch_tv_debug_mac.sh

# Windows
scripts\launch_tv_debug.bat

# Linux
./scripts/launch_tv_debug_linux.sh
```

---

## Step 3: Configure MCP

Add the server to your AI client's MCP configuration.

### Claude Code

Edit `~/.claude/.mcp.json` (global) or create `.mcp.json` in your project:

```json
{
  "mcpServers": {
    "tradingview": {
      "command": "node",
      "args": ["/absolute/path/to/tradingview-mcp/src/server.js"]
    }
  }
}
```

Replace the path with the actual location of your cloned repository.

If you have other MCP servers configured, merge the `tradingview` entry into the existing `mcpServers` object without overwriting.

### Other MCP Clients

This server follows the standard MCP protocol over stdio. Configure it per your client's MCP integration:

```json
{
  "command": "node",
  "args": ["/path/to/tradingview-mcp/src/server.js"]
}
```

---

## Step 4: Restart and Verify

1. Restart your AI client (the MCP server loads at startup)
2. Ask: *"Use tv_health_check to verify TradingView is connected"*

Expected response:
```json
{
  "success": true,
  "cdp_connected": true,
  "chart_symbol": "NASDAQ:AAPL",
  "api_available": true
}
```

If `cdp_connected: false`, TradingView is not running with the debug port. Repeat Step 2.

---

## Step 5: Install CLI (Optional)

```bash
npm link
```

This makes the `tv` command available globally:

```bash
tv status        # check connection
tv quote         # current price
tv symbol AAPL   # change symbol
```

---

## Troubleshooting

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| `cdp_connected: false` | TradingView not running with debug port | Launch TradingView with `--remote-debugging-port=9222` |
| `ECONNREFUSED` | Port 9222 not accessible | Verify TradingView is running; check for firewall blocks |
| MCP server not loading | Invalid config JSON | Check `~/.claude/.mcp.json` syntax with a JSON validator |
| Tools return stale data | Chart still loading | Wait a few seconds and retry |
| `tv` command not found | CLI not linked | Run `npm link` from the project directory |
| Pine Editor tools failing | Editor panel not open | Open the Pine Editor panel first |
| Tools return `undefined` | CDP connection lost | Restart TradingView and reconnect |
| Port 9222 already in use | Another app using the port | Kill the existing process or use a different port |

### Verifying Port 9222

Check that port 9222 is listening:

```bash
# macOS / Linux
lsof -i :9222

# Windows
netstat -ano | findstr :9222
```

You should see `TradingView` or `Electron` listed.

---

## What to Read Next

- [`CLAUDE.md`](CLAUDE.md) — Decision tree for which tool to use (auto-loaded by Claude Code)
- [`README.md`](README.md) — Full tool reference and feature overview
- [`RESEARCH.md`](RESEARCH.md) — Research context and open questions
- `skills/chart-analysis/` — Full institutional analysis pipeline specification
