import { snapshot } from './snapshot.js';

// Manually trigger a snapshot write — useful before a force-quit or mid-session checkpoint.
export async function rotate() {
  console.log('Writing snapshot…');
  await snapshot();
  console.log('Done. Run `sc status` to review.');
}
