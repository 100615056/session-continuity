import { spawnSync } from 'child_process';
import {
  CLAUDE_DIR,
  SESSION_FILE,
  MAX_SESSIONS,
  MAX_WORDS_PER_SESSION,
  ensureDir,
  atomicWrite,
  git,
  trimToWords,
  parseSessions,
  serializeSessions,
  extractPinnedSection,
} from './utils.ts';
import { existsSync, readFileSync } from 'fs';

const NARRATIVE_PROMPT = `You are summarizing a Claude Code development session for the developer who just finished it.
Given the git state below, write a concise session snapshot in this exact format (no other text):

**Status:** <one sentence — what was being worked on and where things stand>

**Decisions made:**
- <decision 1 — include the "why" if inferable from context>
- <decision 2>

**Next steps:**
- <most important thing to do next>
- <second thing if applicable>

**Blockers:** <"None" or a brief description>

Rules:
- Total response must be under 120 words
- Be specific — name files, functions, or commands if relevant
- If git state shows no meaningful changes, say "No significant changes this session"
- Do not add headings, preamble, or closing remarks — just the five fields above

Git state:
`;

interface GitState {
  branch: string;
  status: string;
  log: string;
  diffStat: string;
}

function collectGitState(): GitState {
  return {
    branch: git('branch --show-current', 'unknown'),
    status: git('status --short', '(no changes)'),
    log: git('log --oneline -5', '(no commits)'),
    diffStat: git('diff --stat HEAD', '').split('\n').slice(0, 10).join('\n'),
  };
}

function formatObjectiveEntry(timestamp: string, gitState: GitState): string {
  const { branch, status, log, diffStat } = gitState;
  return [
    `## Session — ${timestamp} | branch: ${branch}`,
    '',
    '**Git status:**',
    '```',
    status || '(clean)',
    '```',
    '',
    '**Recent commits:**',
    '```',
    log || '(none)',
    '```',
    diffStat ? `\n**Diff stat:**\n\`\`\`\n${diffStat}\n\`\`\`` : '',
  ]
    .filter((l) => l !== undefined)
    .join('\n')
    .trim();
}

function fetchNarrative(gitState: GitState): string | null {
  const context = [
    `Branch: ${gitState.branch}`,
    `Status:\n${gitState.status}`,
    `Recent commits:\n${gitState.log}`,
    gitState.diffStat ? `Diff stat:\n${gitState.diffStat}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const prompt = NARRATIVE_PROMPT + context;

  const result = spawnSync('claude', ['-p', prompt], {
    encoding: 'utf8',
    timeout: 15000,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  if (result.status !== 0 || result.error || !result.stdout.trim()) return null;
  return result.stdout.trim();
}

export async function snapshot(): Promise<void> {
  ensureDir(CLAUDE_DIR);

  const timestamp = new Date().toISOString();
  const gitState = collectGitState();

  let entry = formatObjectiveEntry(timestamp, gitState);

  const narrative = fetchNarrative(gitState);
  if (narrative) {
    const trimmed = trimToWords(narrative, MAX_WORDS_PER_SESSION);
    entry += '\n\n**Narrative:**\n' + trimmed;
  } else {
    entry += '\n\n**Narrative:** [unavailable — run `claude --version` to enable]';
  }

  const rawExisting = existsSync(SESSION_FILE)
    ? readFileSync(SESSION_FILE, 'utf8')
    : '';
  const { pinned, rest } = extractPinnedSection(rawExisting);
  const existingSessions = parseSessions(rest);

  const sessions = [entry, ...existingSessions].slice(0, MAX_SESSIONS);
  const serialized = (pinned ? pinned + '\n' : '') + serializeSessions(sessions);
  atomicWrite(SESSION_FILE, serialized);

  process.stderr.write(`[sc] snapshot written — ${timestamp}\n`);
}
