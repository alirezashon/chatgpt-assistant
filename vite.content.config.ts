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
      __APP_NAME__: JSON.stringify(env['VITE_APP_NAME'] ?? 'AI Productivity Layer'),
      __APP_VERSION__: JSON.stringify(env['VITE_APP_VERSION'] ?? '0.1.0'),
      __APP_ENVIRONMENT__: JSON.stringify(env['VITE_APP_ENVIRONMENT'] ?? mode),
      __AI_API_BASE_URL__: JSON.stringify(env['VITE_AI_API_BASE_URL'] ?? ''),
      'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
    },
    plugins: [react(), tailwindcss()],
    publicDir: false,
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
