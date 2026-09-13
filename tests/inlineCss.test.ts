import { beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = process.cwd();
const scriptSrc = resolve(root, 'scripts/inline-css.js');

function makeFixture(name: string, html: string, css: string | null): string {
  const base = resolve(root, 'tests/fixtures', name);
  rmSync(base, { recursive: true, force: true });
  mkdirSync(join(base, 'dist/assets'), { recursive: true });
  mkdirSync(join(base, 'scripts'), { recursive: true });
  writeFileSync(join(base, 'dist/index.html'), html);
  if (css !== null) {
    writeFileSync(join(base, 'dist/assets/app-abc.css'), css);
  }
  // The script resolves paths relative to its own location, so run a copy.
  cpSync(scriptSrc, join(base, 'scripts/inline-css.js'));
  return base;
}

describe('inline-css.js smoke', () => {
  beforeAll(() => {
    mkdirSync(resolve(root, 'tests/fixtures'), { recursive: true });
  });

  it('inlines the bundled CSS into a fixture dist/index.html', () => {
    const base = makeFixture(
      'inline-css-1',
      '<html><head><link rel="stylesheet" href="/assets/app-abc.css"></head><body></body></html>',
      '.a{color:red}',
    );
    const out = execFileSync('node', [join(base, 'scripts/inline-css.js')], {
      encoding: 'utf8',
      timeout: 30000,
    });
    expect(out).toMatch(/inlined/);
    const html = readFileSync(join(base, 'dist/index.html'), 'utf8');
    expect(html).toContain('<style>.a{color:red}</style>');
    expect(html).not.toContain('rel="stylesheet"');
    expect(dirname(base)).toContain('fixtures');
  });

  it('skips idempotently when no external stylesheet remains', () => {
    const base = makeFixture(
      'inline-css-2',
      '<html><head><style>.a{color:red}</style></head><body></body></html>',
      null,
    );
    const out = execFileSync('node', [join(base, 'scripts/inline-css.js')], {
      encoding: 'utf8',
      timeout: 30000,
    });
    expect(out).toMatch(/skipping/);
    const html = readFileSync(join(base, 'dist/index.html'), 'utf8');
    expect(html).toContain('<style>.a{color:red}</style>');
  });
});
