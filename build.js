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
  entryPoints: ['bin/sc'],
  outfile: 'dist/cli.js',
  banner: { js: '#!/usr/bin/env node' },
});

await build({
  ...shared,
  entryPoints: ['mcp/server.js'],
  outfile: 'dist/server.js',
  banner: { js: '#!/usr/bin/env node' },
});

console.log('Build complete → dist/');
