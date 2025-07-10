import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/*/src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.git', '.cache'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'packages/*/dist/',
        '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        '**/*.d.ts',
      ],
    },
    typecheck: {
      enabled: true,
    },
  },
  resolve: {
    alias: {
      '@project-manager/shared': new URL('./packages/shared/src', import.meta.url).pathname,
      '@project-manager/core': new URL('./packages/core/src', import.meta.url).pathname,
      '@project-manager/cli': new URL('./packages/cli/src', import.meta.url).pathname,
    },
  },
})
