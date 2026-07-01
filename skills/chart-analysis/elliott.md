---
name: elliott
description: Elliott Wave counting, mandatory rules, wave identification, Fibonacci validation
---

# Elliott Wave — Rules-Based Counting with Fibonacci Validation

## Mandatory Wave Rules

**Rule 1**: Wave 2 cannot retrace more than 100% of Wave 1
**Rule 2**: Wave 3 is never the shortest impulse wave
**Rule 3**: Wave 4 cannot overlap Wave 1 (exception: diagonal)
**Rule 4**: Wave 5 often shows RSI divergence — if absent, the count is questionable, not invalid. Truncated 5th waves (ending diagonals, failures) lack divergence.

## Wave Identification Process

Use `data_get_ohlcv(count=200)` to identify swing structure:

**Wave 1**: Begins after completed ABC. Volume > preceding bars. RSI crosses above 50.
**Wave 2**: Retrace (50-78.6%). Volume LOWER than Wave 1. Often ABC zigzag.
**Wave 3**: Longest/strongest (1.618-2.618x Wave 1). Volume 1.5x+. RSI 70+.
**Wave 4**: Shallow (23.6-38.2%). Volume LOWEST. Often triangle/flat. RSI 40-50.
**Wave 5**: Final push. May show RSI divergence. Volume LOWER than Wave 3. Absence of divergence suggests a truncated 5th or incorrect count.

## Fibonacci Validation

| Relationship | Typical | Fail if |
|-------------|---------|---------|
| Wave 2 / 1 | 0.50-0.786 | > 1.0 |
| Wave 3 / 1 | 1.618-2.618 | < 1.0 |
| Wave 4 / 3 | 0.236-0.382 | > 0.5 |
| Wave 5 / 1 | 0.618-1.0 | < 0.382 |

## Common Counting Errors

- Counting a corrective ABC as an impulse wave (Wave 1)
- Invalidating Rule 3 (Wave 4 overlap of Wave 1)
- Forcing a count by cherry-picking divergence. Divergence confirms; its absence does not invalidate.
- Misidentifying ending diagonals as regular impulses

### MCP Tools Used

- `data_get_ohlcv(count=200, summary=false)` — swing structure identification
- `data_get_study_values()` — RSI at each wave pivot for divergence check
