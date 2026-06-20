import { snapshot } from './snapshot.ts';

export async function rotate(): Promise<void> {
  console.log('Writing snapshot…');
  await snapshot();
  console.log('Done. Run `sc status` to review.');
}
