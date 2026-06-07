import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

export const CLAUDE_DIR = '.claude';
export const SESSION_FILE = join(CLAUDE_DIR, 'session.md');
export const SETTINGS_FILE = join(CLAUDE_DIR, 'settings.json');
export const CLAUDE_MD = 'CLAUDE.md';
export const SESSION_IMPORT_LINE = '@.claude/session.md';
export const MAX_SESSIONS = 3;
export const MAX_WORDS_PER_SESSION = 150; // ~200 tokens

export const PLACEHOLDER = `<!-- sc: no previous session recorded -->\n`;

export function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function readJson(path, fallback = {}) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

export function writeJson(path, obj) {
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

export function atomicWrite(path, content) {
  const tmp = path + '.tmp';
  writeFileSync(tmp, content, 'utf8');
  renameSync(tmp, path);
}

export function git(cmd, fallback = '') {
  try {
    return execSync(`git ${cmd}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return fallback;
  }
}

export function trimToWords(text, limit) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= limit) return text;
  return words.slice(0, limit).join(' ') + ' …[trimmed]';
}

/**
 * Sessions are stored as blocks separated by a line of three dashes.
 * Returns array of raw session strings (each starts/ends with content, no leading ---).
 */
const PINNED_HEADER = '## Pinned decisions';

/**
 * Splits content into the pinned decisions block (if any) and the rest.
 * The pinned block is the `## Pinned decisions` section and everything
 * before the first `---` session separator.
 */
export function extractPinnedSection(content) {
  if (!content.includes(PINNED_HEADER)) return { pinned: '', rest: content };
  const firstSep = content.indexOf('\n---\n');
  if (firstSep === -1) {
    // Only a pinned section, no session blocks yet
    return { pinned: content.trim(), rest: '' };
  }
  return {
    pinned: content.slice(0, firstSep).trim(),
    rest: content.slice(firstSep),
  };
}

export function parseSessions(content) {
  return content
    .split(/^---$/m)
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('<!--'));
}

export function serializeSessions(sessions) {
  return sessions.map((s) => `---\n${s}\n`).join('\n') + '\n';
}
