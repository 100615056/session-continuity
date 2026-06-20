import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

export const CLAUDE_DIR = '.claude';
export const SESSION_FILE = join(CLAUDE_DIR, 'session.md');
export const SETTINGS_FILE = join(CLAUDE_DIR, 'settings.json');
export const CLAUDE_MD = 'CLAUDE.md';
export const SESSION_IMPORT_LINE = '@.claude/session.md';
export const MAX_SESSIONS = 3;
export const MAX_WORDS_PER_SESSION = 150;

export const PLACEHOLDER = `<!-- sc: no previous session recorded -->\n`;

export function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function readJson<T = Record<string, unknown>>(path: string, fallback: T = {} as T): T {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(path: string, obj: unknown): void {
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

export function atomicWrite(path: string, content: string): void {
  const tmp = path + '.tmp';
  writeFileSync(tmp, content, 'utf8');
  renameSync(tmp, path);
}

export function git(cmd: string, fallback = ''): string {
  try {
    return execSync(`git ${cmd}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return fallback;
  }
}

export function trimToWords(text: string, limit: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= limit) return text;
  return words.slice(0, limit).join(' ') + ' …[trimmed]';
}

const PINNED_HEADER = '## Pinned decisions';

export function extractPinnedSection(content: string): { pinned: string; rest: string } {
  if (!content.includes(PINNED_HEADER)) return { pinned: '', rest: content };
  const firstSep = content.indexOf('\n---\n');
  if (firstSep === -1) {
    return { pinned: content.trim(), rest: '' };
  }
  return {
    pinned: content.slice(0, firstSep).trim(),
    rest: content.slice(firstSep),
  };
}

export function parseSessions(content: string): string[] {
  return content
    .split(/^---$/m)
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('<!--'));
}

export function serializeSessions(sessions: string[]): string {
  return sessions.map((s) => `---\n${s}\n`).join('\n') + '\n';
}
