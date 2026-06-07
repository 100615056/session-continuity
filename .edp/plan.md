# Plan

**Goal:** Build a session continuity tool for AI-native development workflows that helps developers pick up where they left off across Claude sessions without re-explaining context. The tool should capture, store, and restore session state so each new Claude session starts with full context of what was happening, what decisions were made, and what's next.

**Chosen architecture:** `sc` CLI (Node.js) — `sc init` wires up a `Stop` hook + `@import` in CLAUDE.md; hook runs a hybrid script (git state + `claude -p` narrative) and writes a rolling 3-session `.claude/session.md`.

---

## Milestone 1 — Foundation: `sc init` + objective snapshot

**Deliverable:** `sc init` command that wires up the project; `Stop` hook that writes a reliable objective snapshot after every session.

**Done when:**
- `sc init` runs in any project directory without error
- `.claude/session.md` is created with a placeholder on first run
- `CLAUDE.md` gains an `@.claude/session.md` import line (file created if absent)
- `.claude/settings.json` gains a `Stop` hook entry pointing to `sc snapshot`
- After a real Claude session ends normally, `.claude/session.md` contains: timestamp, branch, git status summary, last 5 commits, list of modified files

**Steps:**
- [ ] Scaffold Node.js project: `package.json`, `bin/sc` entry point, `src/` directory
- [ ] Implement `sc init`:
  - [ ] Create `.claude/` directory if absent
  - [ ] Write placeholder `.claude/session.md` ("No previous session recorded.")
  - [ ] Upsert `@.claude/session.md` line into `CLAUDE.md` (create CLAUDE.md if absent)
  - [ ] Upsert `Stop` hook into `.claude/settings.json` (merge, don't overwrite)
  - [ ] Print confirmation with next steps
- [ ] Implement `sc snapshot` (called by hook):
  - [ ] Capture: ISO timestamp, git branch, `git status --short`, `git log --oneline -5`, list of staged/unstaged files
  - [ ] Format as a dated markdown entry (see snapshot format spec below)
  - [ ] Prepend new entry to `.claude/session.md`; keep only last 3 entries (trim older ones)
  - [ ] Write atomically (write to `.claude/session.md.tmp`, then rename)
- [ ] Manual test: run `sc init` in a test repo, end a Claude session, verify `.claude/session.md` is populated

---

## Milestone 2 — Core feature: Claude narrative + graceful degradation

**Deliverable:** `sc snapshot` enriches the objective data with a Claude-generated narrative (decisions, next steps, blockers). Degrades gracefully if `claude -p` is unavailable.

**Done when:**
- After a real session, `.claude/session.md` contains a "## What happened" narrative with decisions made and next steps
- If `claude -p` fails (no API key, timeout, binary absent), objective snapshot is still written without error
- Opening a new Claude session in the same project shows the previous session context in the first response

**Steps:**
- [ ] Add `claude -p` availability check to `sc init` — warn (don't fail) if not found
- [ ] Build narrative prompt template: given git diff summary + user's last few tool calls, ask Claude to output structured fields: `Status`, `Decisions made`, `Next steps`, `Blockers`
- [ ] Integrate `claude -p` call into `sc snapshot`:
  - [ ] Pass prompt template + objective data via stdin to `claude -p`
  - [ ] Set a 15s timeout; on failure write objective-only snapshot + `[narrative unavailable]` note
  - [ ] Append narrative output under `## Narrative` in the session entry
- [ ] Enforce 200-token cap per session entry: trim `## Narrative` section if over limit, preserve structured fields
- [ ] End-to-end test: real Claude session → `sc snapshot` → new session opens → verify context is present and useful

---

## Milestone 3 — Polish & ship

**Deliverable:** Installable tool with supporting commands, full README, and tested on 3+ real projects.

**Done when:**
- `npm install -g session-continuity` works and puts `sc` in PATH
- `sc status`, `sc clear`, and `sc rotate` all work correctly
- README covers: install, `sc init`, how it works, troubleshooting
- Tool tested on 3 real projects with different git states

**Steps:**
- [ ] Implement `sc status` — pretty-prints current `.claude/session.md` to terminal
- [ ] Implement `sc clear` — wipes `.claude/session.md` back to placeholder (with confirmation prompt)
- [ ] Implement `sc rotate` — manually triggers `sc snapshot` (useful before a force-quit)
- [ ] Add `--version` and `--help` flags to `sc`
- [ ] Write `README.md`: install, quickstart (3 commands), how it works diagram, FAQ, troubleshooting
- [ ] Publish to npm as `session-continuity` with `sc` bin alias
- [ ] Test on 3 real projects; fix edge cases (empty git repo, no commits, very large diffs)
- [ ] Add `.claude/session.md` to project's `.gitignore` recommendation (session state is personal, not team)

---

## Snapshot format spec

```markdown
---
## Session — 2026-05-24T21:30:00Z | branch: main

**Status:** In progress — building sc init command

**Git state:**
- Modified: src/init.js, bin/sc
- Untracked: src/snapshot.js

**Recent commits:**
- abc1234 Add sc init scaffold
- def5678 Initial package.json

**Decisions made:**
- Chose Node.js over shell scripts for better JSON handling and npm distribution
- Using atomic write (tmp + rename) to avoid partial snapshots on crash

**Next steps:**
- Implement narrative prompt template
- Wire up claude -p call with 15s timeout

**Blockers:** None
---
```

---

## File layout

```
session-continuity/
├── bin/
│   └── sc                  # CLI entry point (#!/usr/bin/env node)
├── src/
│   ├── init.js             # sc init logic
│   ├── snapshot.js         # sc snapshot logic (called by Stop hook)
│   ├── status.js           # sc status
│   ├── clear.js            # sc clear
│   ├── rotate.js           # sc rotate
│   └── utils.js            # shared helpers (token count, atomic write, git helpers)
├── templates/
│   └── narrative-prompt.md # Template passed to claude -p
├── package.json
└── README.md
```

---

## Dependencies

- M2 depends on M1 — hook and snapshot format must be stable before adding narrative
- `claude -p` (headless Claude CLI) must be available for M2 narrative; M1 has no external deps beyond Node.js + git
- `.claude/settings.json` hook format: validated against Claude Code ≥ 1.x hook schema

---

## Out of scope for this plan
- Incremental `PostToolUse` checkpointing (v2)
- Team sharing or cloud sync
- GUI or web dashboard
- Non-Claude AI tool support

---

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `Stop` hook doesn't fire on crash/force-quit | Medium | Medium — lose one session's snapshot | Atomic write minimizes corruption; v2 adds incremental checkpoint |
| `claude -p` unavailable or times out | Medium | Low — narrative missing, objective data still written | 15s timeout + graceful fallback; warn at `sc init` |
| `.claude/settings.json` hook format changes between Claude Code versions | Low | High — hook silently breaks | Validate JSON schema at `sc init`; document minimum Claude Code version in README |
| Snapshot exceeds context window budget | Low | Medium — eats into usable context | Hard cap at 200 tokens/entry × 3 entries = ~600 tokens max |
| `@file` import not supported in user's Claude Code version | Low | High — context never injected | Check at `sc init`; fallback instruction to paste manually |

_Generated by edp_plan — 2026-05-25T01:38:31.922Z (filled manually)_
