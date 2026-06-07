# Options

**Goal:** Build a session continuity tool for AI-native development workflows that helps developers pick up where they left off across Claude sessions without re-explaining context. The tool should capture, store, and restore session state so each new Claude session starts with full context of what was happening, what decisions were made, and what's next.

---

## Decision 1 — Where does the snapshot live?

| Option | Pros | Cons | Fit |
|--------|------|------|-----|
| A: Section in `CLAUDE.md` | Zero config; always injected; one file to manage | CLAUDE.md grows noisy; mixes project docs with session state; harder to trim | Medium |
| B: Separate `.claude/session.md` imported via `@.claude/session.md` in CLAUDE.md | Clean separation; CLAUDE.md stays readable; easy to trim/rotate | Requires one-time setup of the @import line in CLAUDE.md | **High** |
| C: Append-only `SESSION_LOG.md` in repo root | Full audit trail; git-trackable; easy to diff | Grows unboundedly; loading all history wastes context; git noise | Low |

**Recommended:** Option B — `.claude/session.md` with an `@` import in CLAUDE.md  
**Rationale:** Keeps CLAUDE.md clean for human readers while preserving automatic injection. The one-time setup cost is negligible. Snapshots can be rotated/trimmed without touching CLAUDE.md.

---

## Decision 2 — Who writes the snapshot?

| Option | Pros | Cons | Fit |
|--------|------|------|-----|
| A: Claude writes it (mid-session via prompt) | Rich natural language; captures reasoning and nuance | Requires user to invoke it; easy to forget; quality varies by session | Low |
| B: Deterministic shell script only | Consistent; fast; never fails due to LLM quality | Captures *what* (files changed, git status) but misses *why* (decisions, blockers) | Medium |
| C: Hybrid — script gets objective facts, `claude -p` narrates | Best of both; reliable baseline + narrative; degrades gracefully if claude -p fails | Slightly more complex; adds a CLI call at session end | **High** |

**Recommended:** Option C — hybrid (script + `claude -p` narrative)  
**Rationale:** The script unconditionally captures git state, changed files, and branch; then `claude -p` is given a compact template prompt to generate the decisions/next-steps narrative. If `claude -p` fails or times out, the objective snapshot is still written — no silent data loss.

---

## Decision 3 — When is the snapshot written?

| Option | Pros | Cons | Fit |
|--------|------|------|-----|
| A: `Stop` hook only | Simple; one clear trigger; no per-tool overhead | Lost if Claude crashes or is force-quit | Medium |
| B: Incremental via `PostToolUse` on every significant tool call | Crash-safe; always up to date | High overhead; noisy writes; hard to define "significant" | Low |
| C: Both — `Stop` hook primary, `PostToolUse` as checkpoint every N tool calls | Crash-safe with low overhead | More complex hook setup | **High** |

**Recommended:** Option A for MVP, promote to Option C in v2  
**Rationale:** Start with `Stop` hook only — covers the 95% case of normal session exits. Incremental checkpointing is valuable but adds complexity that should wait until the core format is proven.

---

## Decision 4 — How is the snapshot bounded?

| Option | Pros | Cons | Fit |
|--------|------|------|-----|
| A: Fixed line cap (~60 lines / ~500 tokens), oldest content trimmed | Simple; predictable; never bloats context | Blunt; may trim recent useful detail | Medium |
| B: Claude compacts it at each session end | Smart; preserves what matters | Extra API call; can fail; subjective quality | Low |
| C: Rolling N-session window (keep last 3 sessions, each capped at ~200 tokens) | Audit trail + bounded size; session boundaries are clear | Slightly more parsing logic | **High** |

**Recommended:** Option C — rolling 3-session window, each entry capped at ~200 tokens  
**Rationale:** ~600 tokens total for session state is well within CLAUDE.md budget. Three sessions of history give enough "what happened recently" without growing unboundedly. Each session entry is dated, so stale state is obvious.

---

## Decision 5 — How does the next session ingest the snapshot?

| Option | Pros | Cons | Fit |
|--------|------|------|-----|
| A: Automatic via `@.claude/session.md` import in CLAUDE.md | Zero friction; no user action needed; works on every session | Developer must add the `@` import once during setup | **High** |
| B: Slash command `/resume` | Explicit; user controls when context is loaded | Requires user to remember and invoke it — defeats the "no re-explanation" goal | Low |
| C: `PreToolUse` hook injects on first tool call | Fully automatic; no CLAUDE.md change needed | Hook fires per-tool, needs "first call only" guard; fragile | Medium |

**Recommended:** Option A — automatic via `@.claude/session.md` import  
**Rationale:** The `@import` mechanism in CLAUDE.md is purpose-built for this. One-time setup during `sc init` handles it. Every subsequent session gets context for free — zero friction matches the core success criterion.

---

## Eliminated approaches
- **Full transcript storage** — too large, too noisy; LLMs don't benefit from raw history. Eliminated early.
- **Git commit messages as context** — captures *what* changed but not *why* or *next steps*. Insufficient on its own.
- **Manual CLAUDE.md editing** — the current DIY workaround; eliminated because it requires user discipline and is easy to forget.
- **Team sync / cloud storage** — out of scope per goal definition.

---

## Assumptions & constraints
- Claude Code's `Stop` hook fires reliably on normal session exits (crashes are handled in v2).
- The `@file` import syntax in CLAUDE.md is supported in the user's Claude Code version.
- `claude -p` (headless Claude CLI) is available in PATH for the hybrid write approach.
- The total `.claude/session.md` file stays under ~800 tokens to leave headroom in the context window.
- Developer runs `sc init` once per project to wire up the hook and CLAUDE.md import.

_Generated by edp_options — 2026-05-25T01:19:55.922Z (filled manually)_
