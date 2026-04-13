import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * VITE CONFIGURATION
 * Configures the build pipeline, React plugin integration,
 * and the Vitest testing environment.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    // Enable global test functions (describe, it, expect)
    globals: true,
    // Use JSDOM to simulate a browser environment for React tests
    environment: 'jsdom',
    // Global setup file for test matchers and mocks
    setupFiles: './src/test/setup.js',
  },
})
