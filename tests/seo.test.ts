import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const SITE = 'https://losdrogogolfometro.cloud/';

describe('sitemap.xml', () => {
  it('is valid XML with absolute https URLs and sane fields', () => {
    const xml = readFileSync(resolve(root, 'public/sitemap.xml'), 'utf8');
    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain('http://www.sitemaps.org/schemas/sitemap/0.9');
    const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
    expect(locs.length).toBeGreaterThan(0);
    for (const loc of locs) {
      expect(loc.startsWith(SITE)).toBe(true);
    }
    const lastmods = Array.from(xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)).map((m) => m[1]);
    for (const lm of lastmods) {
      expect(lm).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(lm))).toBe(false);
    }
    const priorities = Array.from(xml.matchAll(/<priority>([^<]+)<\/priority>/g)).map((m) =>
      Number(m[1]),
    );
    for (const p of priorities) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });
});

describe('index.html JSON-LD', () => {
  it('parses and contains the required schema.org nodes', () => {
    const html = readFileSync(resolve(root, 'index.html'), 'utf8');
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    const data = JSON.parse(match![1]) as {
      '@graph': Array<{ '@type'?: string }>;
    };
    expect(Array.isArray(data['@graph'])).toBe(true);
    const types = data['@graph'].map((n) => n['@type']);
    for (const required of ['WebSite', 'SportsOrganization', 'FAQPage', 'Dataset']) {
      expect(types).toContain(required);
    }
    expect(html).toContain(`<link rel="canonical" href="${SITE}" />`);
    expect(html).toContain('og:title');
  });
});
