/**
 * Central session storage — ~/.sc/sessions/<hash>.json per project.
 * Each file holds: { path, name, pinned: [], sessions: [] }
 */

import { existsSync, readFileSync, readdirSync, mkdirSync, unlinkSync, renameSync, accessSync, constants } from 'fs';
import { join, basename } from 'path';
import { homedir } from 'os';
import { createHash } from 'crypto';
import { atomicWrite, MAX_SESSIONS } from '../src/utils.js';

export const SC_DIR = join(homedir(), '.sc', 'sessions');

export function ensureStore() {
  if (!existsSync(SC_DIR)) mkdirSync(SC_DIR, { recursive: true });
}

function projectKey(projectPath) {
  return createHash('sha1').update(projectPath).digest('hex').slice(0, 12);
}

function storePath(projectPath) {
  return join(SC_DIR, `${projectKey(projectPath)}.json`);
}

export function loadStore(projectPath) {
  const file = storePath(projectPath);
  if (!existsSync(file)) {
    return { path: projectPath, name: basename(projectPath), pinned: [], sessions: [] };
  }
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return { path: projectPath, name: basename(projectPath), pinned: [], sessions: [] };
  }
}

export function saveStore(projectPath, store) {
  ensureStore();
  atomicWrite(storePath(projectPath), JSON.stringify(store, null, 2) + '\n');
}

export function addSession(projectPath, entry) {
  const store = loadStore(projectPath);
  store.sessions = [entry, ...store.sessions].slice(0, MAX_SESSIONS);
  saveStore(projectPath, store);
  return store;
}

export function addPinnedDecision(projectPath, text) {
  const store = loadStore(projectPath);
  store.pinned = store.pinned || [];
  store.pinned.push({ text, timestamp: new Date().toISOString() });
  saveStore(projectPath, store);
  return store;
}

export function deleteStore(projectPath) {
  const file = storePath(projectPath);
  if (!existsSync(file)) return false;
  unlinkSync(file);
  return true;
}

export function migrateStore(oldPath, newPath) {
  ensureStore();
  const oldFile = storePath(oldPath);
  const newFile = storePath(newPath);
  if (!existsSync(oldFile)) return { migrated: false, reason: 'no session data at old path' };
  if (existsSync(newFile)) return { migrated: false, reason: 'session data already exists at new path' };
  const store = JSON.parse(readFileSync(oldFile, 'utf8'));
  store.path = newPath;
  store.name = basename(newPath);
  atomicWrite(newFile, JSON.stringify(store, null, 2) + '\n');
  unlinkSync(oldFile);
  return { migrated: true, sessions: store.sessions.length, pinned: store.pinned?.length ?? 0 };
}

export function runDoctor() {
  const checks = [];

  // 1. Sessions directory
  try {
    ensureStore();
    accessSync(SC_DIR, constants.W_OK);
    checks.push({ name: 'Sessions directory', ok: true, detail: SC_DIR });
  } catch {
    checks.push({ name: 'Sessions directory', ok: false, detail: `Not writable: ${SC_DIR}` });
  }

  // 2. Session files
  let files = [];
  try {
    files = readdirSync(SC_DIR).filter(f => f.endsWith('.json'));
    checks.push({ name: 'Session files', ok: true, detail: `${files.length} project(s) tracked` });
  } catch {
    checks.push({ name: 'Session files', ok: false, detail: 'Cannot read sessions directory' });
  }

  // 3. Parse all files, find orphans and corruption
  const orphaned = [];
  const corrupt = [];
  let latestTimestamp = null;
  for (const f of files) {
    try {
      const store = JSON.parse(readFileSync(join(SC_DIR, f), 'utf8'));
      if (store.path && !existsSync(store.path)) {
        orphaned.push({ name: store.name, path: store.path });
      }
      const last = store.sessions?.[0]?.timestamp;
      if (last && (!latestTimestamp || last > latestTimestamp)) latestTimestamp = last;
    } catch {
      corrupt.push(f);
    }
  }

  if (corrupt.length > 0) {
    checks.push({ name: 'Data integrity', ok: false, detail: `${corrupt.length} corrupt file(s): ${corrupt.join(', ')}` });
  } else {
    checks.push({ name: 'Data integrity', ok: true, detail: 'All session files parse correctly' });
  }

  if (orphaned.length > 0) {
    checks.push({ name: 'Orphaned sessions', ok: false, detail: `${orphaned.length} project(s) no longer exist on disk`, orphaned });
  } else {
    checks.push({ name: 'Orphaned sessions', ok: true, detail: 'All tracked projects exist on disk' });
  }

  // 4. Last activity
  if (latestTimestamp) {
    const daysAgo = Math.floor((Date.now() - new Date(latestTimestamp).getTime()) / 86400000);
    checks.push({ name: 'Last activity', ok: daysAgo < 30, detail: daysAgo === 0 ? 'Today' : `${daysAgo} day(s) ago` });
  } else {
    checks.push({ name: 'Last activity', ok: true, detail: 'No sessions saved yet' });
  }

  return checks;
}

export function listAllProjects() {
  ensureStore();
  return readdirSync(SC_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        return JSON.parse(readFileSync(join(SC_DIR, f), 'utf8'));
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      const aDate = a.sessions[0]?.timestamp ?? '';
      const bDate = b.sessions[0]?.timestamp ?? '';
      return bDate.localeCompare(aDate);
    });
}
