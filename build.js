#!/usr/bin/env node
import { build } from 'esbuild';

const shared = {
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  minify: true,
  external: ['@modelcontextprotocol/sdk', 'zod'],
};

await build({
  ...shared,
  entryPoints: ['bin/sc.ts'],
  outfile: 'dist/cli.js',
  banner: { js: '#!/usr/bin/env node' },
});

await build({
  ...shared,
  entryPoints: ['mcp/server.ts'],
  outfile: 'dist/server.js',
});

console.log('Build complete → dist/');
