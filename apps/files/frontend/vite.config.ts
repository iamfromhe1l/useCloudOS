import { fileURLToPath } from 'node:url'

import tailwind from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
export default defineConfig({
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  plugins: [react(), tailwind()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    lib: {
      entry: 'src/main.tsx',
      formats: ['es'],
      fileName: () => 'index.js',
      cssFileName: 'style',
    },
    cssCodeSplit: false,
    minify: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/scheduler/')
          )
            return 'react'
          if (id.includes('/node_modules/@tanstack/')) return 'query'
        },
      },
    },
  },
  test: { environment: 'jsdom', setupFiles: 'src/shared/test/setup.ts' },
})
