# session-continuity

Claude has no memory between sessions. You spend the first few minutes of every new session re-explaining the codebase, the branch, the decisions, and what comes next.

session-continuity fixes that — automatically.

```bash
claude mcp add session-continuity npx session-continuity
```

Open a project in Claude Code and start working. That's it.

---

## How it works

Claude calls four MCP tools — you do nothing.

| Tool | When | What it does |
|---|---|---|
| `load_session` | Session start | Restores context — status, decisions, next steps, branch |
| `save_session` | Session end | Captures an AI-generated snapshot of what happened |
| `pin_decision` | During session | Records key architectural choices that never expire |
| `list_projects` | On demand | Shows all projects with session history |

One-time setup. Claude handles load and save automatically, every session.

---

## What's captured

Every snapshot is an AI-generated briefing written to `.claude/session.md`:

```markdown
## Session — 2026-06-05 | feat/auth

Status: JWT refresh token flow — middleware done, route in progress.

Decisions made:
- httpOnly cookies (not localStorage) — prevents XSS
- 15-min access token TTL

Next steps:
- Wire /auth/refresh route
- Add token rotation on refresh

Blockers: None
```

- **Git state** — branch, status, recent commits
- **Status narrative** — one sentence on where things stand
- **Decisions + why** — key choices made this session with reasoning
- **Next steps** — ordered, most important first
- **Pinned decisions** — architectural choices that survive the rolling window

Up to 3 sessions are kept. Older sessions roll off. Pinned decisions never expire.

---

## Requirements

- Node.js ≥ 18
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)

---

## CLI (setup and management)

| Command | Description |
|---|---|
| `sc status` | Show what's currently saved for this project |
| `sc rotate` | Force a snapshot (e.g. before a crash or force-quit) |
| `sc decide "<why>"` | Pin a permanent decision that survives the rolling session window |
| `sc clear` | Reset session history |

---

## Pinning decisions

Use `sc decide` to record architectural choices, tradeoffs, or rejected ideas that should survive past the 3-session rolling window:

```bash
sc decide "Chose Postgres over SQLite — need concurrent writes in production"
sc decide "Rejected Redis for session storage — adds ops complexity we don't need yet"
```

Pinned decisions appear at the top of `session.md` and are never trimmed.

---

## .gitignore recommendation

Session state is personal — add this to your project's `.gitignore`:

```
.claude/session.md
.claude/session.md.tmp
```

---

## Troubleshooting

**Context not loading in new sessions**

Check that Claude's CLAUDE.md instructions include `load_session`. If you registered the MCP with `claude mcp add`, Claude should call it automatically on session start.

**Narrative says `[unavailable]`**

The `claude` CLI is not in your PATH. Check with `claude --version`. Without it, snapshots still capture objective git state — just no AI-generated narrative.

**Session ended without a snapshot (crash / force-quit)**

Run `sc rotate` manually to write a snapshot from the current git state.

---

## How sessions are bounded

- **Rolling window:** 3 sessions kept, newest first. Older sessions roll off.
- **Pinned decisions:** Never trimmed — use `sc decide` for anything you want to keep long-term.

---

## Pairs with Waypoint

Session continuity captures *where you left off*. [Waypoint](https://github.com/explorenav-dev/waypoint-mcp) captures *where you are in the process* — across 14 guided development steps from first idea to ship.

Together: Claude knows both what was being worked on and where it sits in the dev journey. No manual briefing, ever.

```bash
claude mcp add waypoint npx @waycraft/waypoint-mcp
```

---

## Roadmap

- `PostToolUse` incremental checkpointing (crash safety without `sc rotate`)
- `sc history` — list past session headers
- `sc diff` — show git diff since last snapshot
- Configurable rolling window size

---

## License

[PolyForm Noncommercial License 1.0](https://polyformproject.org/licenses/noncommercial/1.0.0/) — free for personal and non-commercial use.
