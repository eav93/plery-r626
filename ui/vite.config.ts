import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

const routerTarget = process.env.ROUTER_URL || 'http://192.168.0.1'

export default defineConfig({
  plugins: [vue()],
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
      '/api':     { target: routerTarget, changeOrigin: true, secure: false },
      '/cgi-bin': { target: routerTarget, changeOrigin: true, secure: false },
    },
  },
})
