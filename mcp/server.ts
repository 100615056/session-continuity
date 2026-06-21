#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { execSync } from 'child_process';
import { loadStore, addSession, addPinnedDecision, deleteStore, listAllProjects, migrateStore, editLatestSession, removeLatestSession, runDoctor, type DoctorCheck } from './store.ts';

import { createRequire } from 'module';
const { version } = createRequire(import.meta.url)('../package.json') as { version: string };

const server = new McpServer({
  name: 'session-continuity',
  version,
});

function detectBranch(projectPath: string): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd: projectPath, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
}

// ── load_session ─────────────────────────────────────────────────────────────

server.tool(
  'load_session',
  'Load the previous session context for a project. Call this at the start of every session to restore context without re-explanation. Read-only — does not modify any files. Session data is stored in ~/.sc/sessions/, never in your repo.',
  {
    project_path: z
      .string()
      .describe('Absolute path to the project root. Defaults to current working directory. Omit if you are already in the project directory.')
      .optional(),
  },
  async ({ project_path }) => {
    const resolvedPath = project_path || process.cwd();
    const store = loadStore(resolvedPath);

    if (store.sessions.length === 0 && store.pinned.length === 0) {
      const projectName = store.name;
      const allProjects = listAllProjects();
      const orphan = allProjects.find(p => p.name === projectName && p.path !== resolvedPath);

      if (orphan) {
        return {
          content: [{
            type: 'text' as const,
            text: `No session found for ${store.name} at this path, but found session data under the same name at **${orphan.path}** (${orphan.sessions.length} session(s), ${orphan.pinned?.length ?? 0} pinned decision(s)).\n\nThis project was likely renamed or moved. Run \`migrate_project\` with \`old_path: "${orphan.path}"\` and \`new_path: "${resolvedPath}"\` to transfer the history.`,
          }],
        };
      }

      const hint = !project_path ? (() => {
        if (allProjects.length > 0) {
          return `\n\nYour most recently active project is **${allProjects[0].name}** (${allProjects[0].path}). Call \`load_session\` with \`project_path\` set to that path to restore its context, or call \`list_projects\` to see all tracked projects.`;
        }
        return '';
      })() : '';

      return {
        content: [{ type: 'text' as const, text: `No previous session found for ${store.name}. This appears to be a fresh start.${hint}` }],
      };
    }

    const lines = [`# Session context — ${store.name}`, `**Project:** ${store.path}`, ''];

    if (store.pinned.length > 0) {
      lines.push('## Pinned decisions');
      store.pinned.forEach((d) => lines.push(`- ${d.text} _(${d.timestamp})_`));
      lines.push('');
    }

    if (store.pinned.length > 0 && store.sessions.length > 0) {
      lines.push('---', '');
    }

    store.sessions.forEach((s, i) => {
      lines.push(`## ${i === 0 ? 'Last session' : `Session ${i + 1} ago`} — ${s.timestamp}`);
      lines.push(`**Branch:** ${s.branch}`);
      lines.push(`**Status:** ${s.status}`);
      if (s.decisions?.length) {
        lines.push('**Decisions made:**');
        s.decisions.forEach((d) => lines.push(`- ${d}`));
      }
      if (s.next_steps?.length) {
        lines.push('**Next steps:**');
        s.next_steps.forEach((n) => lines.push(`- ${n}`));
      }
      if (s.blockers) lines.push(`**Blockers:** ${s.blockers}`);
      lines.push('');
    });

    return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
  }
);

// ── save_session ─────────────────────────────────────────────────────────────

server.tool(
  'save_session',
  'Save the current session context for a project. Call this at the end of a session or at any checkpoint. Writes to ~/.sc/sessions/ — does not modify your repo. Pinned decisions (set via pin_decision mid-session) are permanent and survive session pruning; the sessions saved here are kept for a rolling window of recent history. Example: save_session({ status: "Sign-in page built, sign-up halfway done", decisions: ["Chose email-only auth — social login out of scope"], next_steps: ["Finish sign-up form", "Add validation", "Wire to Supabase"], blockers: "None", branch: "feature/auth" })',
  {
    project_path: z.string().describe('Absolute path to the project root. Defaults to current working directory.').optional(),
    status: z.string().min(1, 'status cannot be empty').describe('One sentence: what was being worked on and where things stand. Required.'),
    decisions: z.array(z.string()).describe('Key decisions made this session, each with the reason why. (optional)').optional(),
    next_steps: z.array(z.string()).describe('Ordered list of what to do next session, most important first. (optional)').optional(),
    blockers: z.string().describe('Current blockers, or "None". (optional)').optional(),
    branch: z.string().describe('Current git branch. (optional — auto-detected from git if omitted)').optional(),
  },
  async ({ project_path, status, decisions, next_steps, blockers, branch }) => {
    const resolvedPath = project_path || process.cwd();
    const resolvedBranch = branch || detectBranch(resolvedPath);

    const entry = {
      timestamp: new Date().toISOString(),
      branch: resolvedBranch,
      status,
      decisions: decisions || [],
      next_steps: next_steps || [],
      blockers: blockers || 'None',
    };

    addSession(resolvedPath, entry);

    const summary = [
      `Session saved for ${resolvedPath}.`,
      `Status: "${status}"`,
      `Branch: ${resolvedBranch}`,
      decisions?.length ? `Decisions: ${decisions.length}` : null,
      next_steps?.length ? `Next steps: ${next_steps.length}` : null,
      blockers && blockers !== 'None' ? `Blockers: ${blockers}` : null,
      `\nNext session will start with: "${status}"`,
    ].filter(Boolean).join('\n');

    return { content: [{ type: 'text' as const, text: summary }] };
  }
);

// ── pin_decision ─────────────────────────────────────────────────────────────

server.tool(
  'pin_decision',
  'Pin a mid-session decision so it persists even if save_session is never called. Use this the moment a meaningful architectural or product choice is made — do not wait until the end of the session. Unlike save_session (which keeps a rolling window of recent history), pinned decisions persist indefinitely and are never pruned. Writes to ~/.sc/sessions/ — does not modify your repo.',
  {
    project_path: z.string().describe('Absolute path to the project root. Defaults to current working directory.').optional(),
    decision: z.string().describe('The decision to record. Include the "why" — e.g. "Chose X over Y because Z."'),
  },
  async ({ project_path, decision }) => {
    const resolvedPath = project_path || process.cwd();
    addPinnedDecision(resolvedPath, decision);
    return {
      content: [{ type: 'text' as const, text: `Pinned: "${decision}" — persists even if save_session isn't called this session.` }],
    };
  }
);

// ── delete_session ────────────────────────────────────────────────────────────

server.tool(
  'delete_session_permanently',
  'Permanently delete all stored session history and pinned decisions for a project. NOT RECOVERABLE — there is no undo. Use only when you want to fully clear Claude\'s memory of a project. To update what Claude knows instead, use save_session. Only removes data from ~/.sc/sessions/ — does not modify your repo.',
  {
    project_path: z.string().describe('Absolute path to the project root whose session data should be deleted. Required — no CWD default, to prevent accidental deletion.'),
  },
  async ({ project_path }) => {
    const deleted = deleteStore(project_path);
    return {
      content: [{
        type: 'text' as const,
        text: deleted
          ? `Session data deleted for ${project_path}. All sessions and pinned decisions removed.`
          : `No session data found for ${project_path} — nothing to delete.`,
      }],
    };
  }
);

// ── migrate_project ──────────────────────────────────────────────────────────

server.tool(
  'migrate_project',
  'Migrate session data after a project directory is renamed or moved. Transfers all sessions and pinned decisions from the old path to the new path. Use when load_session returns empty for a project you know has history — the directory was likely renamed.',
  {
    old_path: z.string().describe('The previous absolute path to the project root.'),
    new_path: z.string().describe('The current absolute path to the project root.'),
  },
  async ({ old_path, new_path }) => {
    const result = migrateStore(old_path, new_path);
    if (!result.migrated) {
      return { content: [{ type: 'text' as const, text: `Migration skipped: ${result.reason}.` }] };
    }
    return {
      content: [{
        type: 'text' as const,
        text: `Migrated session data from ${old_path} → ${new_path}. Transferred ${result.sessions} session(s) and ${result.pinned} pinned decision(s).`,
      }],
    };
  }
);

// ── list_projects ─────────────────────────────────────────────────────────────

server.tool(
  'list_projects',
  'List all projects with tracked session history, sorted by most recently active.',
  {},
  async () => {
    const projects = listAllProjects();

    if (projects.length === 0) {
      return { content: [{ type: 'text' as const, text: 'No projects tracked yet. Save a session first.' }] };
    }

    const lines = ['# Tracked projects\n'];
    projects.forEach((p) => {
      const last = p.sessions[0];
      lines.push(`**${p.name}**`);
      lines.push(`  Path: ${p.path}`);
      if (last) {
        lines.push(`  Last session: ${last.timestamp}`);
        lines.push(`  Status: ${last.status}`);
      }
      if (p.pinned?.length) {
        lines.push(`  Pinned decisions: ${p.pinned.length}`);
      }
      lines.push('');
    });

    return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
  }
);

// ── doctor ────────────────────────────────────────────────────────────────────

server.tool(
  'doctor',
  'Run diagnostics on the session-continuity setup. Checks: sessions directory writable, data integrity, orphaned sessions (renamed projects), last activity age. Use when load_session returns unexpected results.',
  {},
  async () => {
    const checks = runDoctor();
    const allOk = checks.every((c: DoctorCheck) => c.ok);
    const lines = [
      allOk ? '✅ All checks passed' : '⚠️ Issues found',
      '',
      ...checks.map((c: DoctorCheck) => `${c.ok ? '✅' : '❌'} **${c.name}:** ${c.detail}`),
    ];

    const orphanCheck = checks.find((c: DoctorCheck) => c.name === 'Orphaned sessions' && !c.ok);
    if (orphanCheck?.orphaned) {
      lines.push('', '**To fix orphaned sessions**, run `migrate_project` with the old and new paths:');
      for (const o of orphanCheck.orphaned) {
        lines.push(`  • "${o.name}" was at \`${o.path}\``);
      }
    }

    return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
  }
);

// ── edit_session ─────────────────────────────────────────────────────────────

server.tool(
  'edit_session',
  'Merge updates into the most recent session entry for a project. Use this to correct or refine the last saved session without replacing it entirely. Only the fields you provide are updated — omitted fields are left unchanged.',
  {
    project_path: z.string().describe('Absolute path to the project root. Defaults to current working directory.').optional(),
    updates: z.object({
      status: z.string().optional(),
      decisions: z.array(z.string()).optional(),
      next_steps: z.array(z.string()).optional(),
      blockers: z.string().optional(),
      branch: z.string().optional(),
    }).describe('Fields to update in the most recent session entry. Only provided fields are changed.'),
  },
  async ({ project_path, updates }) => {
    const resolvedPath = project_path || process.cwd();
    const result = editLatestSession(resolvedPath, updates);

    if (!result.updated) {
      return { content: [{ type: 'text' as const, text: `No sessions found for ${resolvedPath} — nothing to edit.` }] };
    }

    const s = result.session!;
    const fields = Object.keys(updates).join(', ');
    return {
      content: [{
        type: 'text' as const,
        text: `Updated session (${s.timestamp}): changed ${fields}.\nStatus: "${s.status}"`,
      }],
    };
  }
);

// ── undo_session ─────────────────────────────────────────────────────────────

server.tool(
  'undo_session',
  'Remove the most recent session entry for a project. Pinned decisions are not affected. Use when the last save_session captured incorrect or unwanted state.',
  {
    project_path: z.string().describe('Absolute path to the project root. Defaults to current working directory.').optional(),
  },
  async ({ project_path }) => {
    const resolvedPath = project_path || process.cwd();
    const result = removeLatestSession(resolvedPath);

    if (!result.removed) {
      return { content: [{ type: 'text' as const, text: `No sessions found for ${resolvedPath} — nothing to undo.` }] };
    }

    const s = result.session!;
    return {
      content: [{
        type: 'text' as const,
        text: `Removed session from ${s.timestamp}: "${s.status}"`,
      }],
    };
  }
);

// ── start ─────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
