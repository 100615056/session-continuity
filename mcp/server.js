#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadStore, addSession, addPinnedDecision, listAllProjects } from './store.js';

import { createRequire } from 'module';
const { version } = createRequire(import.meta.url)('../package.json');

const server = new McpServer({
  name: 'session-continuity',
  version,
});

// ── load_session ─────────────────────────────────────────────────────────────

server.tool(
  'load_session',
  'Load the previous session context for a project. Call this at the start of every session to restore context without re-explanation.',
  {
    project_path: z
      .string()
      .describe('Absolute path to the project root. Defaults to current working directory.')
      .optional(),
  },
  async ({ project_path }) => {
    const path = project_path || process.cwd();
    const store = loadStore(path);

    if (store.sessions.length === 0 && store.pinned.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No previous session found for ${store.name}. This appears to be a fresh start.`,
          },
        ],
      };
    }

    const lines = [`# Session context — ${store.name}`, `**Project:** ${store.path}`, ''];

    if (store.pinned.length > 0) {
      lines.push('## Pinned decisions');
      store.pinned.forEach((d) => lines.push(`- ${d.text} *(${d.timestamp})*`));
      lines.push('');
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

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  }
);

// ── save_session ─────────────────────────────────────────────────────────────

server.tool(
  'save_session',
  'Save the current session context. Call this at the end of a session or at any checkpoint. Claude should summarize what happened, decisions made, and what comes next.',
  {
    project_path: z
      .string()
      .describe('Absolute path to the project root. Defaults to current working directory.')
      .optional(),
    status: z
      .string()
      .describe('One sentence: what was being worked on and where things stand.'),
    decisions: z
      .array(z.string())
      .describe('Key decisions made this session, each with the reason why.')
      .optional(),
    next_steps: z
      .array(z.string())
      .describe('Ordered list of what to do next session, most important first.')
      .optional(),
    blockers: z
      .string()
      .describe('Current blockers, or "None".')
      .optional(),
    branch: z
      .string()
      .describe('Current git branch.')
      .optional(),
  },
  async ({ project_path, status, decisions, next_steps, blockers, branch }) => {
    const path = project_path || process.cwd();
    const entry = {
      timestamp: new Date().toISOString(),
      branch: branch || 'unknown',
      status,
      decisions: decisions || [],
      next_steps: next_steps || [],
      blockers: blockers || 'None',
    };

    addSession(path, entry);

    return {
      content: [
        {
          type: 'text',
          text: `Session saved for ${path}.\nNext session will start with: "${status}"`,
        },
      ],
    };
  }
);

// ── pin_decision ─────────────────────────────────────────────────────────────

server.tool(
  'pin_decision',
  'Pin a permanent decision or architectural choice that should survive the rolling session window. Use for tradeoffs, rejected alternatives, and why-choices.',
  {
    project_path: z
      .string()
      .describe('Absolute path to the project root. Defaults to current working directory.')
      .optional(),
    decision: z
      .string()
      .describe('The decision to record. Include the "why" — e.g. "Chose X over Y because Z."'),
  },
  async ({ project_path, decision }) => {
    const path = project_path || process.cwd();
    addPinnedDecision(path, decision);
    return {
      content: [{ type: 'text', text: `Decision pinned: "${decision}"` }],
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
      return {
        content: [{ type: 'text', text: 'No projects tracked yet. Save a session first.' }],
      };
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

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  }
);

// ── start ─────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
