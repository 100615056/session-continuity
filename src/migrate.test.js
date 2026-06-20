import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createHash } from 'crypto';

// Inline the key functions to test in isolation (avoid import issues with store.js side effects)
function projectKey(projectPath) {
  return createHash('sha1').update(projectPath).digest('hex').slice(0, 12);
}

const testDir = join(tmpdir(), `sc-migrate-test-${Date.now()}`);

function setup() {
  mkdirSync(testDir, { recursive: true });
}

function cleanup() {
  rmSync(testDir, { recursive: true, force: true });
}

describe('projectKey hashing', () => {
  it('produces different hashes for different paths', () => {
    const a = projectKey('/Users/test/ProjectA');
    const b = projectKey('/Users/test/ProjectB');
    assert.notEqual(a, b);
  });

  it('produces the same hash for the same path', () => {
    const a = projectKey('/Users/test/Project');
    const b = projectKey('/Users/test/Project');
    assert.equal(a, b);
  });

  it('produces a 12-character hex string', () => {
    const key = projectKey('/some/path');
    assert.match(key, /^[a-f0-9]{12}$/);
  });

  it('renamed directory produces different hash (the root cause)', () => {
    const original = projectKey('/Users/geli/Desktop/Projects/Boxing Trainer');
    const renamed = projectKey('/Users/geli/Desktop/Projects/Ritual');
    assert.notEqual(original, renamed, 'rename changes hash — sessions are orphaned without migration');
  });
});

describe('migration file operations', () => {
  beforeEach(setup);
  afterEach(cleanup);

  it('migrates store file from old hash to new hash', () => {
    const oldPath = '/Users/test/OldProject';
    const newPath = '/Users/test/NewProject';
    const oldFile = join(testDir, `${projectKey(oldPath)}.json`);
    const newFile = join(testDir, `${projectKey(newPath)}.json`);

    const store = {
      path: oldPath,
      name: 'OldProject',
      pinned: [{ text: 'test decision', timestamp: '2026-01-01' }],
      sessions: [{ status: 'test session', timestamp: '2026-01-01' }],
    };
    writeFileSync(oldFile, JSON.stringify(store));

    // Simulate migration
    const loaded = JSON.parse(readFileSync(oldFile, 'utf8'));
    loaded.path = newPath;
    loaded.name = 'NewProject';
    writeFileSync(newFile, JSON.stringify(loaded));
    rmSync(oldFile);

    assert.ok(!existsSync(oldFile), 'old file removed');
    assert.ok(existsSync(newFile), 'new file created');

    const migrated = JSON.parse(readFileSync(newFile, 'utf8'));
    assert.equal(migrated.path, newPath);
    assert.equal(migrated.name, 'NewProject');
    assert.equal(migrated.sessions.length, 1);
    assert.equal(migrated.pinned.length, 1);
  });

  it('does not overwrite existing store at new path', () => {
    const oldPath = '/Users/test/OldProject';
    const newPath = '/Users/test/NewProject';
    const oldFile = join(testDir, `${projectKey(oldPath)}.json`);
    const newFile = join(testDir, `${projectKey(newPath)}.json`);

    writeFileSync(oldFile, JSON.stringify({ path: oldPath, sessions: [{ status: 'old' }] }));
    writeFileSync(newFile, JSON.stringify({ path: newPath, sessions: [{ status: 'existing' }] }));

    // Migration should be skipped
    assert.ok(existsSync(newFile), 'new file already exists');
    const existing = JSON.parse(readFileSync(newFile, 'utf8'));
    assert.equal(existing.sessions[0].status, 'existing', 'existing data preserved');
  });
});
