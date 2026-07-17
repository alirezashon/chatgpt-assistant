import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDirectory = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  define: {
    __AI_API_BASE_URL__: JSON.stringify(''),
    __APP_ENVIRONMENT__: JSON.stringify('test'),
    __APP_NAME__: JSON.stringify('AI Productivity Layer'),
    __APP_VERSION__: JSON.stringify('0.1.0'),
    __WORKSPACE_API_BASE_URL__: JSON.stringify(''),
  },
  resolve: {
    alias: {
      '@': resolve(rootDirectory, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
