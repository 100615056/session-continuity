import { existsSync } from 'fs';
import { createInterface } from 'readline';
import { SESSION_FILE, PLACEHOLDER, atomicWrite } from './utils.js';

export async function clear() {
  if (!existsSync(SESSION_FILE)) {
    console.log('Nothing to clear — .claude/session.md does not exist.');
    return;
  }

  const confirmed = await confirm('Clear all session history? This cannot be undone. (y/N) ');
  if (!confirmed) {
    console.log('Aborted.');
    return;
  }

  atomicWrite(SESSION_FILE, PLACEHOLDER);
  console.log('Session history cleared.');
}

function confirm(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}
