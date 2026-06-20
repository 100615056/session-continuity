import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Run init inside a temp directory so it doesn't pollute the real project.
async function runInitIn(dir) {
  const origCwd = process.cwd();
  process.chdir(dir);
  try {
    // Re-import fresh each time (clear module cache isn't easy in ESM,
    // so we dynamically import with a cache-busting query param).
    const { init } = await import(`../src/init.ts?t=${Date.now()}`);
    // Suppress console output during tests
    const log = console.log;
    console.log = () => {};
    await init();
    console.log = log;
  } finally {
    process.chdir(origCwd);
  }
}

describe('sc init', () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'sc-init-test-'));
  });

  after(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates .claude/ directory', async () => {
    const dir = mkdtempSync(join(tmpDir, 'proj-'));
    await runInitIn(dir);
    assert.ok(existsSync(join(dir, '.claude')));
  });

  it('creates .claude/session.md with placeholder', async () => {
    const dir = mkdtempSync(join(tmpDir, 'proj-'));
    await runInitIn(dir);
    const content = readFileSync(join(dir, '.claude', 'session.md'), 'utf8');
    assert.ok(content.includes('sc:'));
  });

  it('creates CLAUDE.md with @import line when absent', async () => {
    const dir = mkdtempSync(join(tmpDir, 'proj-'));
    await runInitIn(dir);
    const content = readFileSync(join(dir, 'CLAUDE.md'), 'utf8');
    assert.ok(content.includes('@.claude/session.md'));
  });

  it('prepends @import to existing CLAUDE.md without clobbering content', async () => {
    const dir = mkdtempSync(join(tmpDir, 'proj-'));
    const existing = '# My Project\n\nExisting docs here.\n';
    writeFileSync(join(dir, 'CLAUDE.md'), existing, 'utf8');
    await runInitIn(dir);
    const content = readFileSync(join(dir, 'CLAUDE.md'), 'utf8');
    assert.ok(content.includes('@.claude/session.md'));
    assert.ok(content.includes('Existing docs here.'));
  });

  it('registers Stop hook in .claude/settings.json', async () => {
    const dir = mkdtempSync(join(tmpDir, 'proj-'));
    await runInitIn(dir);
    const settings = JSON.parse(readFileSync(join(dir, '.claude', 'settings.json'), 'utf8'));
    const stopHooks = settings.hooks?.Stop ?? [];
    const hasSnapshotHook = stopHooks.some((entry) =>
      entry.hooks?.some((h) => h.command?.includes('sc snapshot'))
    );
    assert.ok(hasSnapshotHook, 'Stop hook with sc snapshot should be registered');
  });

  it('is idempotent — running init twice does not duplicate hook or @import', async () => {
    const dir = mkdtempSync(join(tmpDir, 'proj-'));
    await runInitIn(dir);
    await runInitIn(dir);

    const claudeMd = readFileSync(join(dir, 'CLAUDE.md'), 'utf8');
    const importCount = (claudeMd.match(/@\.claude\/session\.md/g) || []).length;
    assert.equal(importCount, 1, '@import line should appear exactly once');

    const settings = JSON.parse(readFileSync(join(dir, '.claude', 'settings.json'), 'utf8'));
    const hookCount = (settings.hooks?.Stop ?? []).filter((entry) =>
      entry.hooks?.some((h) => h.command?.includes('sc snapshot'))
    ).length;
    assert.equal(hookCount, 1, 'Stop hook should appear exactly once');
  });

  it('preserves existing hooks in settings.json', async () => {
    const dir = mkdtempSync(join(tmpDir, 'proj-'));
    mkdirSync(join(dir, '.claude'));
    const existing = {
      hooks: {
        Stop: [{ hooks: [{ type: 'command', command: 'echo existing-hook' }] }],
      },
    };
    writeFileSync(join(dir, '.claude', 'settings.json'), JSON.stringify(existing), 'utf8');
    await runInitIn(dir);
    const settings = JSON.parse(readFileSync(join(dir, '.claude', 'settings.json'), 'utf8'));
    const commands = settings.hooks.Stop.flatMap((e) => e.hooks?.map((h) => h.command) ?? []);
    assert.ok(commands.includes('echo existing-hook'), 'existing hook should be preserved');
    assert.ok(commands.some((c) => c.includes('sc snapshot')), 'sc snapshot hook should be added');
  });
});
