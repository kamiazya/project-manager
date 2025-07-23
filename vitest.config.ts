import { cpus } from 'node:os'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Use projects feature for monorepo structure
    projects: [
      // Include all packages with their individual vitest.config.ts files
      'packages/*',
      // Include architecture tests as a separate project
      {
        test: {
          name: 'architecture',
          include: ['etc/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
          environment: 'node',
        },
      },
    ],
    // Global settings that apply to all projects
    globals: true,
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
      '@project-manager/base': fileURLToPath(new URL('./packages/base/src', import.meta.url)),
      '@project-manager/domain': fileURLToPath(new URL('./packages/domain/src', import.meta.url)),
      '@project-manager/application': fileURLToPath(
        new URL('./packages/application/src', import.meta.url)
      ),
      '@project-manager/infrastructure': fileURLToPath(
        new URL('./packages/infrastructure/src', import.meta.url)
      ),
      '@project-manager/sdk': fileURLToPath(new URL('./packages/sdk/src', import.meta.url)),
    },
  },
  optimizeDeps: {
    // Include workspace packages to avoid resolution issues
    include: [
      '@project-manager/base',
      '@project-manager/domain',
      '@project-manager/application',
      '@project-manager/infrastructure',
      '@project-manager/sdk',
    ],
  },
  server: {
    fs: {
      // Allow access to workspace packages
      allow: ['..'],
    },
  },
})
