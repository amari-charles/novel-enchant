/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// Integration test configuration
// Runs tests against real Supabase database
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
    // Only run integration tests
    include: ['tests/integration/**/*.spec.ts'],
    // Longer timeout for database operations
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
