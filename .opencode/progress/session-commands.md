# Session Commands Log

This file tracks which commands have been executed in the current session. Each command checks this file before running and updates it after completion.

## Format

| Command | Timestamp | Status | Details |
|---------|-----------|--------|---------|

## Rules

- Each command must check this log before executing.
- If a required pre-requisite command has not run, the command **must abort**.
- This file is reset to its template at the start of each new session (by `/resume`).
- Never edit entries after writing; append only within a session.

## Pre-requisite Chain

```
/init → /resume → /open-work → /impact → /adr → /benchmark → /dod → /close
```

| Command | Required Pre-requisite | Abort If Missing |
|---------|----------------------|------------------|
| `/resume` | `/init` | Yes |
| `/open-work` | `/resume` | Yes |
| `/impact` | `/open-work` | Yes (for significant changes) |
| `/adr` | `/impact` | Yes (if triggered by architecture change) |
| `/benchmark` | `/impact` | Yes (for ML/DL components) |
| `/dod` | Implementation complete | Yes |
| `/close` | `/init` green + `/dod` (if applicable) | Yes |
