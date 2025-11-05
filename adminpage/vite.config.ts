import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(() => {
  return {
    plugins: [react()],
    // Запускаем сборку из каталога adminpage, выводим в ../dist-admin
    build: {
      outDir: path.resolve(process.cwd(), '../dist-admin'),
      emptyOutDir: true,
    },
    server: {
      port: 5174,
    },
  };
});

