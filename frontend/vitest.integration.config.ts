/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// Integration test configuration
// Runs tests against real Supabase database
// Env vars are passed from CI workflow, not loaded from .env files
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
    setupFiles: './tests/integration/db/setup.ts',
    // Only run integration tests
    include: ['tests/integration/db/**/*.spec.ts'],
    // Longer timeout for database operations
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run test files sequentially to avoid shared user conflicts
    fileParallelism: false,
    // Don't override env - let tests read directly from process.env
    // Env vars are set in CI workflow before running tests
  },
});
