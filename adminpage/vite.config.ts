import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    // Запускаем сборку из каталога adminpage, выводим в ../dist-admin
    build: {
      outDir: resolve(__dirname, '../dist-admin'),
      emptyOutDir: true,
      target: 'es2020',
      sourcemap: mode === 'production' ? 'hidden' : true,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'router': ['react-router-dom'],
            'animations': ['framer-motion'],
            'icons': ['lucide-react'],
            'utils': ['clsx', 'tailwind-merge']
          }
        }
      }
    },
    root: __dirname,
    server: {
      host: '0.0.0.0',
      port: 5174,
      fs: {
        // Разрешаем импортировать файлы из родительской папки (../src/index.css)
        allow: ['..'
]
      }
    },
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : []
    }
  };
});
