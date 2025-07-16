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
