import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const root = path.resolve(process.cwd(), 'adminpage');
  const srcPath = path.resolve(process.cwd(), 'src');
  
  return {
    plugins: [react()],
    root: root,
    build: {
      outDir: path.resolve(process.cwd(), 'dist-admin'),
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@': srcPath,
      },
    },
    server: {
      port: 5174,
    },
  };
});

