import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test, type BrowserContext, type Page } from '@playwright/test';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const distPath = path.join(repositoryRoot, 'dist');
const contentScriptPath = path.join(distPath, 'assets/content.js');
const manifestPath = path.join(distPath, 'manifest.json');

test.describe('extension smoke', () => {
  test('builds a Chrome-loadable extension manifest', async () => {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
      readonly action?: { readonly default_popup?: string };
      readonly content_scripts?: readonly {
        readonly js?: readonly string[];
        readonly matches?: readonly string[];
      }[];
      readonly manifest_version?: number;
      readonly options_ui?: { readonly page?: string };
    };

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.action?.default_popup).toBe('popup.html');
    expect(manifest.options_ui?.page).toBe('options.html');
    expect(manifest.content_scripts?.[0]?.matches).toContain('https://chatgpt.com/*');
    expect(manifest.content_scripts?.[0]?.js).toContain('assets/content.js');
  });

  test('opens the sidebar, assigns a folder, and persists after reload', async ({
    context,
    page,
  }) => {
    await installChromeStorageMock(context, page);
    await routeMockChatGptPage(context);

    await page.goto('https://chatgpt.com/c/smoke-conversation');

    await expect(page.getByLabel('Open ChatGPT Workspace')).toBeVisible();
    await page.getByLabel('Open ChatGPT Workspace').click();
    await expect(page.getByLabel('ChatGPT Workspace sidebar')).toBeVisible();
    await expect(page.getByText('Current conversation', { exact: true })).toBeVisible();
    await expect(page.getByText('Quick start')).toBeVisible();
    await page.getByRole('button', { name: 'Dismiss' }).click();
    await expect(page.getByText('Quick start')).toBeHidden();

    await page.getByLabel('Create folder').click();
    await page.getByLabel('Folder name').fill('Smoke Tests');
    await page.getByRole('dialog').getByRole('button', { name: 'Create Folder' }).click();

    await expect(page.getByLabel('Move conversation to folder')).toContainText('Smoke Tests');
    await page.getByLabel('Move conversation to folder').selectOption({ label: 'Smoke Tests' });
    await expect(page.getByText('In Smoke Tests', { exact: true })).toBeVisible();
    await expect
      .poll(async () => JSON.stringify(await readMockChromeStorage(page)))
      .toContain('Smoke Tests');
    const storedBeforeReload = await readMockChromeStorage(page);

    expect(storedBeforeReload['chatgpt-workspace:folders']).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Smoke Tests' })]),
    );
    expect(storedBeforeReload['chatgpt-workspace:assignments']).toEqual(
      expect.arrayContaining([expect.objectContaining({ conversationId: 'smoke-conversation' })]),
    );

    await page.goto('about:blank');
    const persistedStorage = await readMockChromeStorage(page);

    expect(persistedStorage['chatgpt-workspace:folders']).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Smoke Tests' })]),
    );
    expect(persistedStorage['chatgpt-workspace:assignments']).toEqual(
      expect.arrayContaining([expect.objectContaining({ conversationId: 'smoke-conversation' })]),
    );
  });

  test('shows guidance when no conversations are detected', async ({ context, page }) => {
    await installChromeStorageMock(context, page);
    await routeMockChatGptPage(context);

    await page.goto('https://chatgpt.com/');

    await page.getByLabel('Open ChatGPT Workspace').click();
    await expect(page.getByLabel('ChatGPT Workspace sidebar')).toBeVisible();
    await expect(page.getByText('No conversations detected yet.')).toBeVisible();
    await expect(
      page.getByText('Open an existing ChatGPT conversation from the left sidebar.'),
    ).toBeVisible();
    await expect(page.getByText('sign-in is not required', { exact: false })).toBeVisible();
  });

  test('shows a clear error when ChatGPT DOM detection fails', async ({ context, page }) => {
    await installChromeStorageMock(context, page);
    await routeMockChatGptPage(context);

    await page.goto('https://chatgpt.com/broken-dom');

    await page.getByLabel('Open ChatGPT Workspace').click();
    await expect(page.getByLabel('ChatGPT Workspace sidebar')).toBeVisible();
    await expect(page.getByText('Conversation detection needs attention')).toBeVisible();
    await expect(
      page.getByText("ChatGPT Workspace could not read this page's conversation structure.", {
        exact: false,
      }),
    ).toBeVisible();
    await expect(
      page.getByText('ChatGPT conversation detection failed.', { exact: false }),
    ).toBeVisible();
  });
});

async function installChromeStorageMock(context: BrowserContext, page: Page) {
  let storageValues: Record<string, unknown> = {};

  await context.exposeBinding('cgwStorageClear', () => {
    storageValues = {};
  });
  await context.exposeBinding('cgwStorageDump', () => storageValues);
  await context.exposeBinding('cgwStorageGet', (_source, keys: string | string[] | null) => {
    if (keys === null) {
      return storageValues;
    }

    const requestedKeys = Array.isArray(keys) ? keys : [keys];
    const result: Record<string, unknown> = {};

    for (const key of requestedKeys) {
      result[key] = storageValues[key];
    }

    return result;
  });
  await context.exposeBinding('cgwStorageRemove', (_source, keys: string | string[]) => {
    const removedKeys = new Set(Array.isArray(keys) ? keys : [keys]);
    storageValues = Object.fromEntries(
      Object.entries(storageValues).filter(([key]) => !removedKeys.has(key)),
    );
  });
  await context.exposeBinding('cgwStorageSet', (_source, items: Record<string, unknown>) => {
    Object.assign(storageValues, items);
  });

  await page.addInitScript(() => {
    const browserGlobal = globalThis as unknown as { chrome: unknown };
    const storageGlobal = globalThis as unknown as {
      cgwStorageClear: () => Promise<void>;
      cgwStorageGet: (keys: string | string[] | null) => Promise<Record<string, unknown>>;
      cgwStorageRemove: (keys: string | string[]) => Promise<void>;
      cgwStorageSet: (items: Record<string, unknown>) => Promise<void>;
    };

    browserGlobal.chrome = {
      runtime: {},
      storage: {
        local: {
          clear(callback?: () => void) {
            void storageGlobal.cgwStorageClear().then(() => {
              callback?.();
            });
          },
          get(keys: string | string[] | null, callback: (items: Record<string, unknown>) => void) {
            void storageGlobal.cgwStorageGet(keys).then(callback);
          },
          remove(keys: string | string[], callback?: () => void) {
            void storageGlobal.cgwStorageRemove(keys).then(() => {
              callback?.();
            });
          },
          set(items: Record<string, unknown>, callback?: () => void) {
            void storageGlobal.cgwStorageSet(items).then(() => {
              callback?.();
            });
          },
        },
        onChanged: {
          addListener() {
            // The smoke test does not need cross-tab storage change events.
            return undefined;
          },
          removeListener() {
            // The smoke test does not need cross-tab storage change events.
            return undefined;
          },
        },
      },
    };
  });
}

async function readMockChromeStorage(page: Page): Promise<Record<string, unknown>> {
  return await page.evaluate(() => {
    const storageGlobal = globalThis as unknown as {
      cgwStorageDump: () => Promise<Record<string, unknown>>;
    };

    return storageGlobal.cgwStorageDump();
  });
}

async function routeMockChatGptPage(context: BrowserContext) {
  const contentScript = await readFile(contentScriptPath, 'utf8');

  await context.route('https://chatgpt.com/**', async (route) => {
    const requestUrl = new URL(route.request().url());

    if (route.request().url().endsWith('/assets/content.js')) {
      await route.fulfill({
        body: contentScript,
        contentType: 'text/javascript',
        status: 200,
      });
      return;
    }

    if (requestUrl.pathname === '/') {
      await route.fulfill({
        body: `<!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <title>ChatGPT</title>
          </head>
          <body>
            <main>
              <h1>New chat</h1>
            </main>
            <script src="/assets/content.js"></script>
          </body>
        </html>`,
        contentType: 'text/html',
        status: 200,
      });
      return;
    }

    if (requestUrl.pathname === '/broken-dom') {
      await route.fulfill({
        body: `<!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <title>Broken DOM</title>
          </head>
          <body>
            <nav>
              <a aria-current="page" href="/c/broken-dom">Broken DOM</a>
            </nav>
            <main>
              <h1>Broken DOM</h1>
            </main>
            <script>
              document.querySelectorAll = () => {
                throw new Error('Simulated ChatGPT DOM failure');
              };
            </script>
            <script src="/assets/content.js"></script>
          </body>
        </html>`,
        contentType: 'text/html',
        status: 200,
      });
      return;
    }

    await route.fulfill({
      body: `<!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <title>Smoke Conversation</title>
          </head>
          <body>
            <nav>
              <a aria-current="page" href="/c/smoke-conversation">Smoke Conversation</a>
              <a href="/c/second-conversation">Second Conversation</a>
            </nav>
            <main>
              <h1>Smoke Conversation</h1>
            </main>
            <script src="/assets/content.js"></script>
          </body>
        </html>`,
      contentType: 'text/html',
      status: 200,
    });
  });
}
