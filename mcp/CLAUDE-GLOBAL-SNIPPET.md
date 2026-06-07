# Session continuity

You have access to a `session-continuity` MCP server with four tools: `load_session`, `save_session`, `pin_decision`, and `list_projects`.

**At the start of every session:** Call `load_session` with the current project path to restore context from the previous session. Briefly acknowledge what you found (or note it's a fresh start).

**During a session:** When you or the developer make a meaningful architectural decision or choose one approach over another, call `pin_decision` to record it with the reasoning. Don't wait until the end.

**At the end of a session (or when asked to save context):** Call `save_session` with:
- `status`: one sentence on where things stand right now
- `decisions`: list of choices made this session and why
- `next_steps`: ordered list of what to do next session
- `blockers`: anything blocking progress, or "None"
- `branch`: current git branch

The goal is zero re-explanation across sessions. Be thorough when saving — the next session's you is the audience.
