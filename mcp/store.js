/**
 * Central session storage — ~/.sc/sessions/<hash>.json per project.
 * Each file holds: { path, name, pinned: [], sessions: [] }
 */

import { existsSync, readFileSync, readdirSync, mkdirSync } from 'fs';
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
