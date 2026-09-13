// Post-build: inline the bundled CSS into dist/index.html.
// Removes the render-blocking stylesheet request (~600ms on slow 4G).
// Node stdlib only. Idempotent: skips when no external stylesheet link remains.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const htmlPath = join(dist, 'index.html');

const html = readFileSync(htmlPath, 'utf8');
const match = html.match(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/);
if (!match) {
  console.log('[inline-css] no external stylesheet found, skipping');
  process.exit(0);
}

const cssFile = match[1].replace(/^\//, '');
const css = readFileSync(join(dist, cssFile), 'utf8');
const inlined = html.replace(match[0], `<style>${css}</style>`);
writeFileSync(htmlPath, inlined);
console.log(`[inline-css] inlined ${cssFile} (${css.length} chars) into index.html`);
