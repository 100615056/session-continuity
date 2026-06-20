import { existsSync, readFileSync, writeFileSync } from 'fs';
import {
  CLAUDE_DIR,
  SESSION_FILE,
  SETTINGS_FILE,
  CLAUDE_MD,
  SESSION_IMPORT_LINE,
  PLACEHOLDER,
  ensureDir,
  readJson,
  writeJson,
} from './utils.ts';

interface HookEntry {
  hooks: Array<{ type: string; command: string }>;
}

interface Settings {
  hooks?: {
    Stop?: HookEntry[];
    PreCompact?: HookEntry[];
  };
}

export async function init(): Promise<void> {
  const steps: string[] = [];

  ensureDir(CLAUDE_DIR);
  steps.push('✓ .claude/ directory ready');

  if (!existsSync(SESSION_FILE)) {
    writeFileSync(SESSION_FILE, PLACEHOLDER, 'utf8');
    steps.push('✓ .claude/session.md created');
  } else {
    steps.push('· .claude/session.md already exists');
  }

  const claudeMdExists = existsSync(CLAUDE_MD);
  let claudeMdContent = claudeMdExists ? readFileSync(CLAUDE_MD, 'utf8') : '';

  if (!claudeMdContent.includes(SESSION_IMPORT_LINE)) {
    const importBlock = `\n<!-- sc: session continuity -->\n${SESSION_IMPORT_LINE}\n`;
    claudeMdContent = importBlock + claudeMdContent;
    writeFileSync(CLAUDE_MD, claudeMdContent, 'utf8');
    steps.push(`✓ CLAUDE.md ${claudeMdExists ? 'updated' : 'created'} with @import`);
  } else {
    steps.push('· CLAUDE.md already has @import');
  }

  const settings = readJson<Settings>(SETTINGS_FILE, {});
  const hook = { type: 'command', command: 'sc snapshot' };

  if (!settings.hooks) settings.hooks = {};

  if (!settings.hooks.Stop) settings.hooks.Stop = [];
  const stopWired = settings.hooks.Stop.some(
    (entry) =>
      Array.isArray(entry.hooks) &&
      entry.hooks.some((h) => h.command && h.command.includes('sc snapshot'))
  );
  if (!stopWired) {
    settings.hooks.Stop.push({ hooks: [hook] });
    steps.push('✓ Stop hook registered in .claude/settings.json');
  } else {
    steps.push('· Stop hook already registered');
  }

  if (!settings.hooks.PreCompact) settings.hooks.PreCompact = [];
  const preCompactWired = settings.hooks.PreCompact.some(
    (entry) =>
      Array.isArray(entry.hooks) &&
      entry.hooks.some((h) => h.command && h.command.includes('sc snapshot'))
  );
  if (!preCompactWired) {
    settings.hooks.PreCompact.push({ hooks: [hook] });
    steps.push('✓ PreCompact hook registered in .claude/settings.json');
  } else {
    steps.push('· PreCompact hook already registered');
  }

  writeJson(SETTINGS_FILE, settings);

  let claudeAvailable = false;
  try {
    const { execSync } = await import('child_process');
    execSync('claude --version', { stdio: 'pipe' });
    claudeAvailable = true;
    steps.push('✓ claude CLI found — narrative snapshots enabled');
  } catch {
    steps.push(
      '⚠ claude CLI not found — snapshots will be objective-only (git state, no narrative)'
    );
  }

  console.log('\nsc init complete\n');
  steps.forEach((s) => console.log(' ', s));
  console.log('\nHow it works:');
  console.log('  • When a Claude session ends, sc snapshot runs automatically');
  console.log('  • The snapshot is saved to .claude/session.md');
  console.log('  • CLAUDE.md imports it, so every new session starts with full context');
  if (!claudeAvailable) {
    console.log('\n  To enable narrative summaries, install the Claude CLI:');
    console.log('  https://docs.anthropic.com/en/docs/claude-code');
  }
  console.log();
}
