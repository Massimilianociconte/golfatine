// Minimal browser stubs so storage/profile modules run under the node env.
// No extra deps (happy-dom) needed for these unit tests.

// In-memory localStorage
const store = new Map<string, string>();
const localStorageStub = {
  getItem: (k: string): string | null => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string): void => {
    store.set(k, String(v));
  },
  removeItem: (k: string): void => {
    store.delete(k);
  },
  clear: (): void => {
    store.clear();
  },
  key: (i: number): string | null => Array.from(store.keys())[i] ?? null,
  get length(): number {
    return store.size;
  },
};

// Minimal document.cookie jar (name=value pairs)
const cookieJar = new Map<string, string>();
const documentStub: Record<string, unknown> = {};
Object.defineProperty(documentStub, 'cookie', {
  get: () =>
    Array.from(cookieJar.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; '),
  set: (raw: string) => {
    const first = String(raw).split(';')[0] ?? '';
    const eq = first.indexOf('=');
    if (eq > 0) {
      const name = first.slice(0, eq).trim();
      const value = first.slice(eq + 1).trim();
      if (name) cookieJar.set(name, value);
    }
    if (String(raw).trim() === '') cookieJar.clear();
  },
  configurable: true,
});

class CustomEventStub {
  type: string;
  detail: unknown;
  constructor(type: string, init?: { detail?: unknown }) {
    this.type = type;
    this.detail = init?.detail;
  }
}

const windowStub: Record<string, unknown> = {
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
};

// Node exposes some globals (e.g. navigator) as getter-only: define instead.
for (const [key, value] of Object.entries({
  localStorage: localStorageStub,
  document: documentStub,
  window: windowStub,
  navigator: { onLine: true },
  CustomEvent: CustomEventStub,
})) {
  Object.defineProperty(globalThis, key, {
    value,
    writable: true,
    configurable: true,
  });
}
