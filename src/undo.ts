import { loadStore, saveStore } from '../mcp/store.ts';

export async function undo(args: string[]): Promise<void> {
  const projectPath = args[0] || process.cwd();
  const store = loadStore(projectPath);

  if (store.sessions.length === 0) {
    console.log('Nothing to undo.');
    return;
  }

  const removed = store.sessions.shift()!;
  saveStore(projectPath, store);
  console.log(`Removed session from ${removed.timestamp}: "${removed.status}"`);
}
