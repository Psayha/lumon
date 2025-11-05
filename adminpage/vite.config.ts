import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(() => {
  return {
    plugins: [react()],
    // Запускаем сборку из каталога adminpage, выводим в ../dist-admin
    build: {
      outDir: path.resolve(__dirname, '../dist-admin'),
      emptyOutDir: true,
    },
    root: __dirname,
    server: {
      port: 5174,
      fs: {
        // Разрешаем импортировать файлы из родительской папки (../src/index.css)
        allow: ['..']
      }
    },
  };
});

