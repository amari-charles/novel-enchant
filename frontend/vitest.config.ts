/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

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
    // Only run unit tests
    include: ['tests/unit/**/*.spec.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
    // Exclude integration and e2e tests from unit test runs
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/integration/**',
      '**/tests/e2e/**',
    ],
  },
});
