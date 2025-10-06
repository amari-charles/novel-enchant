/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// Default vitest configuration for unit tests
// Excludes integration tests which are run separately with vitest.integration.config.ts
export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    // Exclude integration tests from unit test runs
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/integration/**',
    ],
  },
});
