import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { PLACEHOLDER, serializeSessions, parseSessions, extractPinnedSection } from './utils.ts';

async function runDecideIn(dir, message) {
  const origCwd = process.cwd();
  process.chdir(dir);
  try {
    const { decide } = await import(`../src/decide.ts?t=${Date.now()}`);
    const log = console.log;
    console.log = () => {};
    await decide([message]);
    console.log = log;
  } finally {
    process.chdir(origCwd);
  }
}

async function runSnapshotIn(dir) {
  const origCwd = process.cwd();
  process.chdir(dir);
  try {
    const { snapshot } = await import(`../src/snapshot.ts?t=${Date.now()}`);
    await snapshot();
  } finally {
    process.chdir(origCwd);
  }
}

describe('sc decide', () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'sc-decide-test-'));
  });

  after(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates a pinned decisions section when none exists', async () => {
    const dir = mkdtempSync(join(tmpDir, 'proj-'));
    const { mkdirSync } = await import('fs');
    mkdirSync(join(dir, '.claude'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'session.md'), PLACEHOLDER, 'utf8');

    await runDecideIn(dir, 'Use Node.js over shell for better JSON handling');
    const content = readFileSync(join(dir, '.claude', 'session.md'), 'utf8');
    assert.ok(content.includes('## Pinned decisions'), 'should create pinned section');
    assert.ok(content.includes('Use Node.js over shell for better JSON handling'));
  });

  it('appends to an existing pinned section', async () => {
    const dir = mkdtempSync(join(tmpDir, 'proj-'));
    const { mkdirSync } = await import('fs');
    mkdirSync(join(dir, '.claude'), { recursive: true });
    writeFileSync(join(dir, '.claude', 'session.md'), PLACEHOLDER, 'utf8');

    await runDecideIn(dir, 'First decision');
    await runDecideIn(dir, 'Second decision');
    const content = readFileSync(join(dir, '.claude', 'session.md'), 'utf8');
    assert.ok(content.includes('First decision'));
    assert.ok(content.includes('Second decision'));
    const count = (content.match(/## Pinned decisions/g) || []).length;
    assert.equal(count, 1, 'should only have one pinned section header');
  });

  it('pinned section survives sc snapshot rolling window trim', async () => {
    const dir = mkdtempSync(join(tmpDir, 'proj-'));
    const { mkdirSync } = await import('fs');
    mkdirSync(join(dir, '.claude'), { recursive: true });

    // Pre-populate with 3 sessions (newest-first) + a pinned decision
    const sessions = [
      '## Session — 2026-01-03 | branch: main\n\nNewest.',
      '## Session — 2026-01-02 | branch: main\n\nMiddle.',
      '## Session — 2026-01-01 | branch: main\n\nOldest.',
    ];
    const pinnedBlock = `## Pinned decisions\n- Use atomic writes _(2026-01-01T00:00:00Z)_\n`;
    writeFileSync(
      join(dir, '.claude', 'session.md'),
      pinnedBlock + '\n' + serializeSessions(sessions),
      'utf8'
    );

    // Run a 4th snapshot — should drop oldest session but keep pinned block
    await runSnapshotIn(dir);

    const content = readFileSync(join(dir, '.claude', 'session.md'), 'utf8');
    assert.ok(content.includes('## Pinned decisions'), 'pinned section should survive');
    assert.ok(content.includes('Use atomic writes'), 'pinned decision should survive');
    assert.ok(!content.includes('Oldest.'), 'oldest session should be rolled off');

    const { rest } = extractPinnedSection(content);
    const remaining = parseSessions(rest);
    assert.equal(remaining.length, 3, 'should still have 3 sessions after trim');
  });
});
