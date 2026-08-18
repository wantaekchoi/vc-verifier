import { build } from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });

await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  minify: true,
  sourcemap: true,
  target: ['es2022'],
  splitting: true,
  outdir: 'dist',
  entryNames: 'app',
  chunkNames: 'chunk-[hash]',
});

for (const file of ['index.html', 'styles.css']) await cp(file, `dist/${file}`);
await cp('fonts', 'dist/fonts', { recursive: true });
await cp('public', 'dist', { recursive: true });
