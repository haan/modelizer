import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import { visualizer } from 'rollup-plugin-visualizer'

const packageJson = JSON.parse(
  fs.readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
)

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    process.env.ANALYZE === 'true'
      ? visualizer({
          filename: 'stats.html',
          template: 'treemap',
          open: true,
        })
      : null,
  ].filter(Boolean),
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (
            id.includes('node-sql-parser') ||
            id.includes('big-integer') ||
            id.includes('@types/pegjs') ||
            id.includes('pegjs')
          ) {
            return 'mysql-parser'
          }
          if (id.includes('reactflow')) {
            return 'reactflow'
          }
          if (id.includes('@radix-ui')) {
            return 'radix'
          }
          if (id.includes('@dnd-kit')) {
            return 'dnd'
          }
          if (id.includes('html-to-image')) {
            return 'export'
          }

          return 'vendor'
        },
      },
    },
  },
})
