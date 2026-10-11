import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, readdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// SC_DIR is derived from homedir() at import time, so point HOME at a temp dir first.
const home = mkdtempSync(join(tmpdir(), 'sc-store-'));
process.env.HOME = home;
const store = await import('./store.ts');

const entry = (status: string) => ({
  timestamp: new Date().toISOString(),
  branch: 'main',
  status,
  decisions: [],
  next_steps: [],
  blockers: 'None',
});

describe('store', () => {
  const project = join(home, 'proj');

  before(() => mkdirSync(project));
  after(() => rmSync(home, { recursive: true, force: true }));

  it('maps trailing-slash, relative and symlinked paths to one store', () => {
    const link = join(home, 'proj-link');
    symlinkSync(project, link);

    store.addSession(project + '/', entry('first'));
    store.addSession(link, entry('second'));

    const loaded = store.loadStore(project);
    assert.equal(loaded.sessions.length, 2);
    assert.equal(loaded.sessions[0].status, 'second');
    assert.equal(loaded.path, store.canonicalPath(project));
    assert.equal(readdirSync(store.SC_DIR).length, 1);
  });

  it('keeps only the most recent sessions', () => {
    for (let i = 0; i < 5; i++) store.addSession(project, entry(`s${i}`));
    const loaded = store.loadStore(project);
    assert.equal(loaded.sessions.length, 3);
    assert.equal(loaded.sessions[0].status, 's4');
  });

  it('no longer exposes a way to add pinned decisions', () => {
    assert.equal('addPinnedDecision' in store, false);
  });
});
