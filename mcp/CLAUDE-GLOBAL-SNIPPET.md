# Session continuity

You have access to a `session-continuity` MCP server for picking up where you left off. The main tools are `load_session` and `save_session`.

**At the start of every session:** Call `load_session` with the specific project's root path (not a parent folder holding several projects) to restore context from the previous session. Briefly acknowledge what you found (or note it's a fresh start).

**During a session:** Record durable architectural decisions in Claude's memory, not in session-continuity.

**At the end of a session (or when asked to save context):** Call `save_session` with:
- `status`: one sentence on where things stand right now
- `decisions`: list of choices made this session and why
- `next_steps`: ordered list of what to do next session
- `blockers`: anything blocking progress, or "None"
- `branch`: current git branch

The goal is zero re-explanation across sessions. Be thorough when saving — the next session's you is the audience.
