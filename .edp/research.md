# Research

**Goal:** Build a session continuity tool for AI-native development workflows that helps developers pick up where they left off across Claude sessions without re-explaining context. The tool should capture, store, and restore session state so each new Claude session starts with full context of what was happening, what decisions were made, and what's next.

## Key questions to answer
- How does Claude Code surface context at session start, and what hooks fire at session end?
- What format (structured vs. freeform) best balances human readability and LLM parsability?
- How do we avoid the snapshot growing stale or unboundedly large?
- Can a hook reliably write state *after* Claude has finished reasoning but *before* the session closes?

---

## Prior art & libraries

### Claude Code native primitives
- **`CLAUDE.md`** — Automatically injected into every session as system context. The primary insertion point for persistent project memory. Supports headings, lists, and free text. Editable by Claude or scripts.
- **`~/.claude/memory/`** — User-level memory files, managed via `/memory` command. Good for developer preferences; less suited to per-project state.
- **Claude Code hooks** (`~/.claude/settings.json` → `hooks`) — Shell scripts that fire on lifecycle events: `PreToolUse`, `PostToolUse`, `Stop`, `SubagentStop`, `Notification`. The `Stop` hook fires when a session ends normally. No built-in "session start" hook, but a `PreToolUse` on the first tool call approximates it.
- **`/compact`** — Compacts the in-session context but does NOT persist anything to disk. Context is lost on close.
- **`/memory`** — Lets Claude write to memory files mid-session, but requires manual invocation.

### Community / ecosystem patterns
- **Manual CLAUDE.md session notes** — Common DIY approach: developers append a "Last session" section by hand before starting. Brittle; easy to forget.
- **Git commit messages as context** — Some teams rely on git log as a substitute for session notes. Covers *what* changed but not *why* or *next steps*.
- **Cursor "rules for AI"** / `.cursorrules` — Analogous to CLAUDE.md; same problem (static, manually maintained).
- **No established library** exists for automated cross-session AI context persistence as of mid-2026. This is genuinely novel tooling.

### What has failed in similar past attempts
- Storing full transcripts: too large, too noisy, LLMs don't benefit from raw history.
- Storing only code diffs: misses the *why* (decisions, rejected alternatives).
- Relying on Claude to "remember" — it doesn't; context window resets on every session.

---

## Architecture & patterns

### Pattern 1: Hook-driven snapshot (write on stop, inject on start)
- A `Stop` hook runs a script that asks Claude (or a deterministic template) to write a structured snapshot to `.claude/session-state.md`.
- A `PreToolUse` hook (first call) or CLAUDE.md import reads that file and injects it into context.
- **Fits Claude Code natively.** Hooks are already supported; no new runtime needed.

### Pattern 2: CLAUDE.md as the living document
- The snapshot *is* CLAUDE.md (or a dedicated section within it).
- The Stop hook updates a `## Current Session` block in CLAUDE.md.
- Next session reads it automatically — no injection step needed.
- Risk: CLAUDE.md can get large; needs compaction/rotation logic.

### Pattern 3: Git-tracked session log
- Each session appends to `SESSION_LOG.md` committed to the repo.
- Next session's CLAUDE.md imports the last N entries.
- Good audit trail; avoids single-file growth; enables diffing.
- Adds git noise unless sessions are squash-committed.

### Applicable design patterns
- **Append-only log + compaction** (like WAL in databases): safe, auditable, bounded with a trim step.
- **Structured handoff document**: fixed schema (status / decisions / next steps / blockers) — predictable for LLMs to parse.
- **Convention over configuration**: zero-config by putting snapshot in a well-known location (`CLAUDE.md` section or `.claude/session.md`).

---

## Risks & constraints

### Technical risks
- **`Stop` hook reliability**: if Claude crashes or the user force-quits, the hook may not fire. Mitigation: also write incrementally via `PostToolUse` on significant actions.
- **Snapshot quality depends on Claude's summary**: if the session was chaotic, the summary may be poor. Mitigation: use a structured prompt template that forces specific fields.
- **CLAUDE.md token budget**: Claude Code injects CLAUDE.md into the context window. Very large files eat into usable context. Cap snapshot at ~500 tokens / ~400 words.
- **Hook script failures are silent**: if the script errors, the session ends without a snapshot. Mitigation: write a minimal fallback (timestamp + git status) even on script error.
- **No "session start" hook**: Claude Code has no explicit session-open event. Workaround: use `PreToolUse` on first tool call, or rely on CLAUDE.md injection (which is automatic).

### Hard constraints
- Local filesystem only (per out-of-scope decision).
- Must work with existing Claude Code CLI — no new daemon or background process.
- Snapshot file must be human-readable (developers will review/edit it).
- Single-developer use case only.

---

## Open decisions
<!-- To be resolved in edp_options -->
- [ ] **Where does the snapshot live?** Option A: dedicated section in `CLAUDE.md`. Option B: separate `.claude/session.md` file imported by CLAUDE.md. Option C: append-only `SESSION_LOG.md`.
- [ ] **Who writes the snapshot?** Option A: Claude writes it (rich, natural language; quality varies). Option B: deterministic script (consistent; misses reasoning). Option C: hybrid (script captures git/file state; Claude narrates decisions).
- [ ] **When is the snapshot written?** Option A: only on `Stop` hook. Option B: incrementally via `PostToolUse`. Option C: both.
- [ ] **How is the snapshot bounded?** Option A: fixed max lines, oldest trimmed. Option B: Claude compacts it each session. Option C: rolling N-session log.
- [ ] **How does the next session ingest it?** Option A: automatic via CLAUDE.md injection. Option B: slash command (`/resume`). Option C: hook on first tool call.

## Workspace observations
**Path:** /Users/geli/Desktop/session-continuity
**Package:** none detected

_Generated by edp_research — 2026-05-25T01:15:06.922Z (filled manually)_
