import { cpus } from 'node:os'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'packages/*/src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/architecture/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'etc/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: ['node_modules', 'dist', '.git', '.cache'],
    // Parallel execution settings - threads is slightly faster but forks is more compatible
    // pool: 'threads', // Uncomment for maximum speed (may have compatibility issues)
    pool: 'forks', // Default, more stable and compatible
    poolOptions: {
      threads: {
        // Optimize thread count based on CPU cores
        // Leave 1 core for system operations, cap at 8 for memory efficiency
        maxThreads: Math.max(Math.min(8, cpus().length - 1), 1),
        minThreads: Math.max(Math.floor(cpus().length / 2), 1),
        // Keep single thread disabled for parallel execution
        singleThread: false,
        // Keep isolation enabled for test safety
        isolate: true,
        // Enable atomics for better thread synchronization
        useAtomics: true,
      },
    },
    // Improve test isolation and performance
    isolate: true,
    passWithNoTests: true,
    // Reporter settings for better parallel output
    reporters: process.env.CI ? ['verbose'] : ['default'],
    // Enable file parallelism for maximum performance
    fileParallelism: true,
    // Keep sequential execution by default to avoid race conditions
    // Individual test files can opt-in to concurrent execution with test.concurrent
    sequence: {
      concurrent: false, // Keep sequential for safety
    },
    // Maximum number of concurrent tests when explicitly using test.concurrent
    maxConcurrency: 8, // Increased from default 5 for better performance
    // Test timeouts - reasonable defaults
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'packages/*/dist/',
        '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        '**/*.d.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    typecheck: {
      enabled: true,
    },
    deps: {
      // Ensure Vitest can resolve modules from both node_modules and packages
      moduleDirectories: ['node_modules', 'packages'],
    },
  },
  resolve: {
    alias: {
      '@project-manager/shared': fileURLToPath(new URL('./packages/shared/src', import.meta.url)),
      '@project-manager/core': fileURLToPath(new URL('./packages/core/src', import.meta.url)),
      '@project-manager/cli': fileURLToPath(new URL('./packages/cli/src', import.meta.url)),
      '@project-manager/mcp-server': fileURLToPath(
        new URL('./packages/mcp-server/src', import.meta.url)
      ),
    },
  },
  optimizeDeps: {
    // Include workspace packages to avoid resolution issues
    include: [
      '@project-manager/shared',
      '@project-manager/core',
      '@project-manager/cli',
      '@project-manager/mcp-server',
    ],
  },
  server: {
    fs: {
      // Allow access to workspace packages
      allow: ['..'],
    },
  },
})
