import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { parseSessions, serializeSessions, PLACEHOLDER } from './utils.js';

async function runSnapshotIn(dir) {
  const origCwd = process.cwd();
  process.chdir(dir);
  try {
    const { snapshot } = await import(`../src/snapshot.js?t=${Date.now()}`);
    await snapshot();
  } finally {
    process.chdir(origCwd);
  }
}

describe('sc snapshot', () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'sc-snap-test-'));
  });

  after(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates .claude/session.md if absent', async () => {
    const dir = mkdtempSync(join(tmpDir, 'proj-'));
    mkdirSync(join(dir, '.claude'));
    await runSnapshotIn(dir);
    assert.ok(existsSync(join(dir, '.claude', 'session.md')));
  });

  it('session entry contains timestamp and branch fields', async () => {
    const dir = mkdtempSync(join(tmpDir, 'proj-'));
    mkdirSync(join(dir, '.claude'));
    await runSnapshotIn(dir);
    const content = readFileSync(join(dir, '.claude', 'session.md'), 'utf8');
    assert.ok(/## Session — \d{4}-\d{2}-\d{2}/.test(content), 'should have dated session header');
    assert.ok(content.includes('branch:'), 'should include branch field');
    assert.ok(content.includes('Git status:'), 'should include git status');
  });

  it('rolling window: only keeps the last 3 sessions', async () => {
    const dir = mkdtempSync(join(tmpDir, 'proj-'));
    mkdirSync(join(dir, '.claude'));

    // Pre-populate with 3 existing sessions (newest-first, matching sc snapshot's write order)
    const old = [
      '## Session — 2026-01-03 | branch: main\n\nNewest so far.',
      '## Session — 2026-01-02 | branch: main\n\nMiddle.',
      '## Session — 2026-01-01 | branch: main\n\nOldest.',
    ];
    writeFileSync(join(dir, '.claude', 'session.md'), serializeSessions(old), 'utf8');

    // Run a 4th snapshot
    await runSnapshotIn(dir);

    const content = readFileSync(join(dir, '.claude', 'session.md'), 'utf8');
    const sessions = parseSessions(content);
    assert.equal(sessions.length, 3, 'should keep exactly 3 sessions');
    assert.ok(!content.includes('Oldest.'), 'oldest session should be dropped');
  });

  it('does not leave a .tmp file behind', async () => {
    const dir = mkdtempSync(join(tmpDir, 'proj-'));
    mkdirSync(join(dir, '.claude'));
    await runSnapshotIn(dir);
    assert.equal(existsSync(join(dir, '.claude', 'session.md.tmp')), false);
  });

  it('works in a directory with no git repo', async () => {
    const dir = mkdtempSync(join(tmpDir, 'no-git-'));
    mkdirSync(join(dir, '.claude'));
    // No git init — should not throw
    await runSnapshotIn(dir);
    const content = readFileSync(join(dir, '.claude', 'session.md'), 'utf8');
    assert.ok(content.includes('## Session'), 'should still write entry without git');
  });
});
