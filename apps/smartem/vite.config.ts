import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8000'

  return {
    plugins: [
      react(),
      tailwindcss(),
      TanStackRouterVite(),
      mode === 'analyze' &&
        visualizer({
          open: !process.env.CI,
          filename: 'bundle-analysis.html',
          gzipSize: true,
          brotliSize: true,
        }),
    ],
    resolve: {
      alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) },
      dedupe: ['react', 'react-dom', 'react/jsx-runtime', '@mui/material'],
    },
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
