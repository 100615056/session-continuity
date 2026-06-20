#!/usr/bin/env node

import { init } from '../src/init.ts';
import { snapshot } from '../src/snapshot.ts';
import { status } from '../src/status.ts';
import { clear } from '../src/clear.ts';
import { rotate } from '../src/rotate.ts';
import { decide } from '../src/decide.ts';
import { runDoctor, type DoctorCheck } from '../mcp/store.ts';

const [, , cmd, ...args] = process.argv;

function doctor(): void {
  const checks = runDoctor();
  const allOk = checks.every((c: DoctorCheck) => c.ok);
  console.log(allOk ? '✅ All checks passed\n' : '⚠️  Issues found\n');
  for (const c of checks) {
    console.log(`${c.ok ? '✅' : '❌'} ${c.name}: ${c.detail}`);
  }
  const orphanCheck = checks.find((c: DoctorCheck) => c.name === 'Orphaned sessions' && !c.ok);
  if (orphanCheck?.orphaned) {
    console.log('\nTo fix orphaned sessions, run:');
    for (const o of orphanCheck.orphaned) {
      console.log(`  npx session-continuity migrate "${o.path}" "<new-path>"`);
    }
  }
  if (!allOk) process.exit(1);
}

const commands: Record<string, (args: string[]) => Promise<void> | void> = {
  init, snapshot, status, clear, rotate, decide, doctor,
};

if (!cmd || cmd === '--help' || cmd === '-h') {
  console.log(`
sc — session continuity for Claude Code

Commands:
  sc init              Wire up this project (run once per project)
  sc snapshot          Write a session snapshot (called automatically by Stop hook)
  sc status            Show the current session state
  sc clear             Reset session history
  sc rotate            Manually trigger a snapshot write (use before force-quit)
  sc decide "<why>"    Pin a permanent decision that survives the rolling window
  sc doctor            Check setup health: directory, data integrity, orphaned sessions

Options:
  --version, -v  Print version
  --help, -h     Show this help
`);
  process.exit(0);
}

if (cmd === '--version' || cmd === '-v') {
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  const pkg = require('../package.json') as { version: string };
  console.log(pkg.version);
  process.exit(0);
}

if (!commands[cmd]) {
  console.error(`Unknown command: ${cmd}. Run 'sc --help' for usage.`);
  process.exit(1);
}

try {
  await commands[cmd](args);
} catch (err) {
  console.error(`sc ${cmd} failed:`, (err as Error).message);
  process.exit(1);
}
