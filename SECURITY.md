# Security Policy

## Scope

This project connects to a locally running TradingView Desktop instance via Chrome DevTools Protocol (CDP) on `localhost:9222`. Security concerns relevant to this project include:

- **Local machine safety**: Code injection via crafted tool inputs, unintended data exposure through tool outputs
- **Port exposure**: The CDP debug port granting control of the Electron browser instance
- **Credential safety**: Ensuring session tokens and API keys are not leaked through tool outputs

## Out of Scope

- TradingView's own security (report to TradingView directly)
- Chrome DevTools Protocol security (report to Google/Chromium)
- Claude Code, Anthropic, or MCP SDK security (report to respective maintainers)

---

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately:

1. Open a [GitHub Security Advisory](https://github.com/vinod99/tradingview-mcp/security/advisories/new)
2. Provide a clear description of the issue, reproduction steps, and potential impact

**Do not** open a public issue for security vulnerabilities.

---

## Best Practices for Users

### Port Security

The Chrome DevTools Protocol debug port (`9222`) grants comprehensive control over the TradingView Desktop application, including the ability to execute JavaScript in its context. **Treat this port with the same care as a remote code execution vulnerability.**

| ✅ Do | ❌ Don't |
|------|---------|
| Run only on localhost (127.0.0.1) | Expose port 9222 to your local network |
| Keep port 9222 closed with firewall rules | Bind to 0.0.0.0 or any external interface |
| Close TradingView when not using the bridge | Leave the debug port running unattended |
| Use localhost-only for all MCP configurations | Port-forward or tunnel port 9222 |

### Data Handling

- All market data should remain on your machine
- Do not pipe `tv stream` output to external services or cloud storage
- Screenshots captured by the tool contain chart data — review before sharing
- Pine Script source code may contain proprietary logic — handle accordingly

### Updates

- Keep TradingView Desktop updated to receive security patches
- Keep Node.js updated to receive runtime security fixes
- Review dependencies periodically for vulnerabilities

### Multi-User Systems

If you run TradingView MCP on a shared or multi-user machine:
- Restrict file permissions on the MCP config file (`~/.claude/.mcp.json`)
- Do not enable `--remote-debugging-port` when other users have shell access
- Be aware that any process on the same machine can potentially connect to port 9222

---

## Additional Resources

- [Chrome DevTools Protocol Security Considerations](https://chromedevtools.github.io/devtools-protocol/)
- [Node.js Security Best Practices](https://nodejs.org/en/learn/getting-started/security-best-practices)
