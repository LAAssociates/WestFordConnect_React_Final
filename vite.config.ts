import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate React and React DOM into their own chunk
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // Separate icon library (lucide-react can be large)
            'icons': ['lucide-react'],
          },
        },
      },
      // Increase chunk size warning limit to 600 KB (optional)
      chunkSizeWarningLimit: 600,
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_TARGET_URL,
          changeOrigin: true,
          secure: false,
        },
        '/hubs': {
          target: env.VITE_API_TARGET_URL,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
        '/cdn-download': {
          target: 'https://dru7up4h3zrl.cloudfront.net',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/cdn-download/, ''),
        },
      },
    },
  }
})
