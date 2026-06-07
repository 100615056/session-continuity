import { existsSync, readFileSync } from 'fs';
import { SESSION_FILE } from './utils.js';

export async function status() {
  if (!existsSync(SESSION_FILE)) {
    console.log('No session file found. Run `sc init` first.');
    return;
  }

  const content = readFileSync(SESSION_FILE, 'utf8').trim();

  if (!content || content.startsWith('<!--')) {
    console.log('No session recorded yet. End a Claude session to generate the first snapshot.');
    return;
  }

  console.log('\n── Current session state (' + SESSION_FILE + ') ──\n');
  console.log(content);
  console.log('\n── end ──\n');
}
