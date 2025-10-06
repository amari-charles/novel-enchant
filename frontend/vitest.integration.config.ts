/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// Integration test configuration
// Runs tests against real Supabase database
// Env vars are passed from shell (local .env or CI workflow), not loaded here
export default defineConfig({
  // Don't load .env files - use environment variables passed from CI or shell
  // Setting envDir to a non-existent path prevents Vite from loading .env files
  envDir: '/dev/null',
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
    // Only run integration tests
    include: ['tests/integration/**/*.spec.ts'],
    // Longer timeout for database operations
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run test files sequentially to avoid shared user conflicts
    fileParallelism: false,
    // Don't override env - let tests read directly from process.env
    // Env vars are set in CI workflow before running tests
  },
});
