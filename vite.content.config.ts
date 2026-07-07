import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

const rootDirectory = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      __APP_NAME__: JSON.stringify(env['VITE_APP_NAME'] ?? 'ChatGPT Workspace'),
      __APP_VERSION__: JSON.stringify(env['VITE_APP_VERSION'] ?? '0.1.0'),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': resolve(rootDirectory, 'src'),
      },
    },
    build: {
      emptyOutDir: false,
      lib: {
        entry: resolve(rootDirectory, 'src/content/main.tsx'),
        fileName: () => 'content.js',
        formats: ['iife'],
        name: 'ChatGptWorkspaceContent',
      },
      outDir: 'dist/assets',
    },
  };
});
