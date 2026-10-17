import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    plugins: [
      react(),
      tailwindcss(),
      ...(mode === 'analyze'
        ? [
            visualizer({
              filename: 'dist/stats.html',
              gzipSize: true,
              brotliSize: true,
              open: false,
            }),
          ]
        : []),
    ],
    build: {
      manifest: true,
      chunkSizeWarningLimit: 550,
    },
    server: {
      watch: {
        ignored: ['**/playwright-report/**', '**/test-results/**', '**/storybook-static/**'],
      },
      host: 'localhost',
      port: 5173,
      strictPort: true,
      proxy: {
        '/app-assets': {
          target: env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8080',
          changeOrigin: false,
        },
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8080',
          changeOrigin: false,
        },
      },
    },
    test: {
      server: { deps: { inline: ['@material/material-color-utilities'] } },
      environment: 'jsdom',
      setupFiles: './src/shared/test/setup.ts',
      css: true,
      exclude: ['tests/**', 'node_modules/**', 'dist/**', 'storybook-static/**'],
    },
  }
})
