import { describe, expect, it, vi } from 'vitest';

import { MemoryStorageDriver } from '@/runtime/storage';

import { BrowserUnderstandingEngine } from './browser-understanding-engine';
import { DriverSemanticStateStore, MemorySemanticStateStore } from './semantic-state-store';

describe('BrowserUnderstandingEngine', () => {
  it('creates a semantic model from DOM and accessibility information', async () => {
    document.title = 'Checkout';
    document.documentElement.lang = 'en';
    document.body.innerHTML = `
      <main>
        <h1>Checkout</h1>
        <label for="email">Email</label>
        <input id="email" name="email" type="email" required />
        <button aria-label="Pay now">Pay now</button>
      </main>
    `;
    const engine = new BrowserUnderstandingEngine();
    const model = await engine.analyze(document);

    const button = model.elements.find((element) => element.name === 'Pay now');
    const input = model.elements.find((element) => element.name === 'Email');

    expect(model.title).toBe('Checkout');
    expect(button?.role).toBe('button');
    expect(button?.purpose).toBe('payment');
    expect(button?.risk).toBe('high');
    expect(input?.role).toBe('input');
    expect(input?.state.required).toBe(true);
    expect(model.graph.nodes.length).toBeGreaterThan(model.elements.length);
  });

  it('redacts sensitive values and marks page risk', async () => {
    document.title = 'Login';
    document.body.innerHTML = `
      <form>
        <label for="password">Password</label>
        <input id="password" name="password" type="password" value="super-secret" />
        <button>Login</button>
      </form>
    `;
    const engine = new BrowserUnderstandingEngine();
    const model = await engine.analyze(document);
    const password = model.elements.find((element) => element.state.redacted);

    expect(password?.state.redacted).toBe(true);
    expect(password?.name).toBe('[REDACTED]');
    expect(model.risk.sensitiveElementIds).toContain(password?.id);
    expect(model.risk.risk).toBe('high');
  });

  it('finds semantic targets without selector queries', async () => {
    document.title = 'Store';
    document.body.innerHTML = `
      <button>Continue shopping</button>
      <button>Checkout</button>
    `;
    const engine = new BrowserUnderstandingEngine();
    const model = await engine.analyze(document);
    const [target] = engine.findTargets(model, {
      query: 'checkout button',
      role: 'button',
    });

    expect(target?.element.name).toBe('Checkout');
    expect(target?.confidence).toBeGreaterThan(0.5);
  });

  it('computes semantic diffs across dynamic page changes', async () => {
    document.title = 'App';
    document.body.innerHTML = `<button>Save</button>`;
    const engine = new BrowserUnderstandingEngine();
    const first = await engine.analyze(document);

    document.body.innerHTML = `<button disabled>Save</button><button>Cancel</button>`;
    const second = await engine.analyze(document);
    const diff = engine.diff(first, second);

    expect(diff.changes.some((change) => change.type === 'added')).toBe(true);
    expect(diff.changes.some((change) => change.type === 'state-changed')).toBe(true);
  });

  it('persists snapshots through the storage-backed state store', async () => {
    const driver = new MemoryStorageDriver();
    const engine = new BrowserUnderstandingEngine({
      store: new DriverSemanticStateStore(driver),
    });
    document.title = 'Persisted';
    document.body.innerHTML = `<button>Save</button>`;

    const model = await engine.analyze(document);
    const secondEngine = new BrowserUnderstandingEngine({
      store: new DriverSemanticStateStore(driver),
    });
    const snapshots = await secondEngine.snapshots();

    expect(snapshots.map((snapshot) => snapshot.id)).toContain(model.id);
  });

  it('integrates optional visual and OCR evidence adapters', async () => {
    document.title = 'Visual';
    document.body.innerHTML = `<button>Primary action</button>`;
    const engine = new BrowserUnderstandingEngine({
      ocr: {
        extract: () =>
          Promise.resolve([
            {
              confidence: 0.95,
              language: 'en',
              rect: { height: 10, width: 100, x: 0, y: 0 },
              text: 'Primary action',
            },
          ]),
      },
      store: new MemorySemanticStateStore(),
      visual: {
        analyze: () =>
          Promise.resolve({
            evidence: [
              {
                confidence: 0.9,
                source: 'visual',
                text: 'Primary button detected visually.',
              },
            ],
          }),
      },
    });

    const model = await engine.analyze(document);

    expect(model.elements[0]?.evidence.some((evidence) => evidence.source === 'visual')).toBe(true);
    expect(model.fingerprint.length).toBeGreaterThan(0);
  });

  it('observes DOM mutations with debounce', async () => {
    vi.useFakeTimers();
    document.title = 'Observe';
    document.body.innerHTML = `<div id="root"></div>`;
    const engine = new BrowserUnderstandingEngine();
    const listener = vi.fn();
    const disposable = engine.observe(document, listener, 10);

    document.getElementById('root')?.setAttribute('data-state', 'changed');
    await Promise.resolve();
    vi.advanceTimersByTime(20);

    expect(listener).toHaveBeenCalled();
    await disposable.dispose();
    vi.useRealTimers();
  });
});
