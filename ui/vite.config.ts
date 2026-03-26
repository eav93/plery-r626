import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

const routerTarget = process.env.ROUTER_URL || 'http://192.168.0.1'

export default defineConfig({
  plugins: [tailwindcss(), vue()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  build: {
    outDir: '../rootfs/www-comfast/app',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
  server: {
    strictPort: true,
    open: '/',
    proxy: {
      '/api':     { target: routerTarget, changeOrigin: true, secure: false, timeout: 30000, proxyTimeout: 30000 },
      '/cgi-bin': { target: routerTarget, changeOrigin: true, secure: false },
    },
  },
})
