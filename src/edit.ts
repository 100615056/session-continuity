import { execSync } from 'child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadStore, saveStore, type SessionEntry } from '../mcp/store.ts';

export async function edit(args: string[]): Promise<void> {
  const projectPath = args[0] || process.cwd();
  const store = loadStore(projectPath);

  if (store.sessions.length === 0) {
    console.log('No sessions to edit.');
    return;
  }

  const latest = store.sessions[0];
  const tmpFile = join(tmpdir(), `sc-edit-${Date.now()}.json`);
  writeFileSync(tmpFile, JSON.stringify(latest, null, 2) + '\n', 'utf8');

  const editor = process.env.EDITOR || 'nano';
  try {
    execSync(`${editor} "${tmpFile}"`, { stdio: 'inherit' });
  } catch {
    console.error('Editor exited with an error.');
    try { unlinkSync(tmpFile); } catch {}
    return;
  }

  let updated: SessionEntry;
  try {
    updated = JSON.parse(readFileSync(tmpFile, 'utf8')) as SessionEntry;
  } catch {
    console.error('Failed to parse edited file — changes discarded.');
    try { unlinkSync(tmpFile); } catch {}
    return;
  }

  try { unlinkSync(tmpFile); } catch {}

  store.sessions[0] = updated;
  saveStore(projectPath, store);
  console.log(`Session updated (${updated.timestamp}).`);
}
