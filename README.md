# session-continuity

Claude has no memory between sessions. You spend the first few minutes of every new session re-explaining the codebase, the branch, the decisions, and what comes next.

session-continuity fixes that — automatically.

```bash
claude mcp add session-continuity npx session-continuity
```

Open a project in Claude Code and start working. That's it.

---

## Other editors

<details>
<summary><strong>Cursor</strong></summary>

Add to `.cursor/mcp.json` in your project root (or `~/.cursor/mcp.json` globally):

```json
{
  "mcpServers": {
    "session-continuity": {
      "command": "npx",
      "args": ["session-continuity"]
    }
  }
}
```

</details>

<details>
<summary><strong>VS Code (Copilot)</strong></summary>

Add to `.vscode/mcp.json` in your project root:

```json
{
  "servers": {
    "session-continuity": {
      "command": "npx",
      "args": ["session-continuity"]
    }
  }
}
```

</details>

<details>
<summary><strong>Windsurf</strong></summary>

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "session-continuity": {
      "command": "npx",
      "args": ["session-continuity"]
    }
  }
}
```

</details>

---

## How it works

```
Session 1 ends          Session 2 starts
     │                        │
     ▼                        ▼
 save_session()          load_session()
     │                        │
     ▼                        ▼
 ~/.sc/sessions/     ──►  Context restored
 (JSON on disk)           (zero re-explanation)
```

Claude calls the MCP tools — you do nothing.

| Tool | When | What it does |
|---|---|---|
| `load_session` | Session start | Restores context — status, decisions, next steps, branch |
| `save_session` | Session end | Captures a snapshot of what happened — status, decisions, next steps, blockers, branch. Example: `save_session({ status: "Auth done", decisions: ["JWT over sessions"], next_steps: ["Add refresh tokens"], blockers: "None" })` |
| `pin_decision` | Mid-session | Records key architectural choices the moment they're made — persists even if `save_session` is never called |
| `list_projects` | On demand | Shows all projects with session history and last-saved timestamps |
| `delete_session_permanently` | On demand | Fully erases Claude's memory of a project — irreversible, no undo |

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

## `pin_decision` vs `save_session`

`save_session` is a snapshot at the end of a session. `pin_decision` is a safety net during one — it records a choice the moment it's made so it's safe even if the session ends unexpectedly. Pinned decisions also never get pruned; they persist indefinitely, unlike session history which rolls off after 3 sessions.

Call it as soon as you reach a meaningful fork. Claude does this automatically.

## `delete_session_permanently`

Completely erases all session memory for a project — context, decisions, history. Use when the old context is actively wrong or the project has fundamentally changed direction. **There is no undo.** Claude will warn you before calling it.

If you just want to update what Claude knows, use `save_session` with fresh content instead.

---

## Pinning decisions

Use `sc decide` to record architectural choices, tradeoffs, or rejected ideas that should survive past the 3-session rolling window:

```bash
sc decide "Chose Postgres over SQLite — need concurrent writes in production"
sc decide "Rejected Redis for session storage — adds ops complexity we don't need yet"
```

Pinned decisions appear at the top of `session.md` and are never trimmed.

---

## Security note

Session data is stored as **plaintext** in `~/.sc/sessions/`. Do not include secrets, API keys, passwords, or credentials in session status, decisions, or next_steps fields. The data is local to your machine and never transmitted, but it is not encrypted.

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

## Part of the Waycraft MCP Suite

session-continuity is the **foundation layer** — every other tool in the suite benefits from persistent context across sessions.

**[Waypoint](https://www.npmjs.com/package/@waycraft/waypoint-mcp)** — session-continuity captures *where you left off*. Waypoint captures *where you are in the process* — across 16 guided steps from first idea to ship. Together, Claude knows both what was being worked on and where it sits in the build journey.

```bash
claude mcp add waypoint npx @waycraft/waypoint-mcp
```

**[@waycraft/mcp-manager](https://www.npmjs.com/package/@waycraft/mcp-manager)** — if session-continuity drops mid-session, mcp-manager can restart it without leaving the conversation. No lost context.

```bash
claude mcp add mcp-manager npx @waycraft/mcp-manager
```

---

## Roadmap

- `PostToolUse` incremental checkpointing (crash safety without `sc rotate`)
- `sc history` — list past session headers
- `sc diff` — show git diff since last snapshot
- Configurable rolling window size

---

## Feedback & Discussion

Something didn't work, felt missing, or you found a better workflow?

→ [GitHub Discussions](https://github.com/100615056/session-continuity/discussions)

---

## License

[MIT](LICENSE)
