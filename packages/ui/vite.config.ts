import tailwind from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
export default defineConfig({
  test: { environment: 'jsdom', setupFiles: 'test/setup.ts', css: true },
  plugins: [react(), tailwind()],
  build: {
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: { index: 'src/index.ts', selection: 'src/selection.ts' },
      formats: ['es'],
      fileName: (_format, name) => name + '.js',
      cssFileName: 'style',
    },
    rollupOptions: { external: [/^react($|\/)/, /^react-dom($|\/)/] },
  },
})
