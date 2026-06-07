import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

import {
  trimToWords,
  parseSessions,
  serializeSessions,
  atomicWrite,
} from './utils.js';

// ── trimToWords ──────────────────────────────────────────────────────────────

describe('trimToWords', () => {
  it('returns text unchanged when under limit', () => {
    assert.equal(trimToWords('hello world', 10), 'hello world');
  });

  it('trims to limit and appends ellipsis marker', () => {
    const result = trimToWords('one two three four five', 3);
    assert.equal(result, 'one two three …[trimmed]');
  });

  it('handles empty string', () => {
    assert.equal(trimToWords('', 10), '');
  });

  it('trims exactly at boundary', () => {
    const result = trimToWords('a b c', 3);
    assert.equal(result, 'a b c');
  });
});

// ── parseSessions / serializeSessions ────────────────────────────────────────

describe('parseSessions / serializeSessions round-trip', () => {
  const s1 = '## Session — 2026-01-01 | branch: main\n\nSome content here.';
  const s2 = '## Session — 2026-01-02 | branch: feat\n\nOther content.';

  it('round-trips a single session', () => {
    const serialized = serializeSessions([s1]);
    const parsed = parseSessions(serialized);
    assert.deepEqual(parsed, [s1]);
  });

  it('round-trips multiple sessions', () => {
    const serialized = serializeSessions([s1, s2]);
    const parsed = parseSessions(serialized);
    assert.deepEqual(parsed, [s1, s2]);
  });

  it('parseSessions ignores placeholder comments', () => {
    const withPlaceholder = '<!-- sc: no previous session recorded -->\n';
    const parsed = parseSessions(withPlaceholder);
    assert.equal(parsed.length, 0);
  });

  it('parseSessions on empty string returns empty array', () => {
    assert.deepEqual(parseSessions(''), []);
  });
});

// ── atomicWrite ──────────────────────────────────────────────────────────────

describe('atomicWrite', () => {
  let tmpDir;

  before(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'sc-test-'));
  });

  after(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes content to the target file', () => {
    const target = join(tmpDir, 'out.md');
    atomicWrite(target, 'hello');
    assert.equal(readFileSync(target, 'utf8'), 'hello');
  });

  it('does not leave a .tmp file behind', () => {
    const target = join(tmpDir, 'out2.md');
    atomicWrite(target, 'world');
    assert.equal(existsSync(target + '.tmp'), false);
  });

  it('overwrites existing file', () => {
    const target = join(tmpDir, 'out3.md');
    writeFileSync(target, 'old content', 'utf8');
    atomicWrite(target, 'new content');
    assert.equal(readFileSync(target, 'utf8'), 'new content');
  });
});
