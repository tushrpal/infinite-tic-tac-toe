import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@/components': path.resolve(__dirname, './components'),
      '@/hooks': path.resolve(__dirname, './hooks'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/ws': path.resolve(__dirname, './ws'),
      '@/theme': path.resolve(__dirname, './theme'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
