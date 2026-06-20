import { existsSync, readFileSync } from 'fs';
import { SESSION_FILE, PLACEHOLDER, atomicWrite } from './utils.ts';

const PINNED_HEADER = '## Pinned decisions';
const PINNED_NOTE = '<!-- sc: pinned decisions survive the rolling session window -->';

export async function decide(args: string[]): Promise<void> {
  const message = args[0];
  if (!message || !message.trim()) {
    console.error('Usage: sc decide "Your decision or rationale here"');
    process.exit(1);
  }

  const text = message.trim();
  const bullet = `- ${text}`;
  const timestamp = new Date().toISOString();
  const entry = `${bullet} _(${timestamp})_`;

  const existing = existsSync(SESSION_FILE)
    ? readFileSync(SESSION_FILE, 'utf8')
    : PLACEHOLDER;

  let updated: string;

  if (existing.includes(PINNED_HEADER)) {
    updated = existing.replace(
      /(## Pinned decisions\n(?:<!--[^>]*-->\n)?)([\s\S]*?)(\n---|\n<!-- sc:|$)/,
      (_: string, header: string, body: string, tail: string) => `${header}${body}\n${entry}${tail}`
    );
  } else {
    const pinnedBlock = `${PINNED_HEADER}\n${PINNED_NOTE}\n${entry}\n\n`;
    const firstSession = existing.indexOf('---\n');
    if (firstSession === -1 || existing.trim() === PLACEHOLDER.trim()) {
      updated = pinnedBlock + (existing.startsWith('<!--') ? '' : existing);
    } else {
      updated =
        existing.slice(0, firstSession) + pinnedBlock + existing.slice(firstSession);
    }
  }

  atomicWrite(SESSION_FILE, updated);
  console.log(`Decision pinned: "${text}"`);
}
