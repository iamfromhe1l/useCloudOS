import tailwind from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
export default defineConfig({
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  plugins: [react(), tailwind()],
  build: {
    minify: true,
    lib: {
      entry: 'src/main.tsx',
      formats: ['es'],
      fileName: () => 'index.js',
      cssFileName: 'style',
    },
    cssCodeSplit: false,
  },
})
