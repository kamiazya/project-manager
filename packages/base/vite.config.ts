/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { projectManagerArchitectureRules } from '../../etc/vite/architecture.config.ts'
import { cleanArchitecture } from '../../etc/vite/plugins/architecture-fitness.ts'

export default defineConfig({
  test: {
    name: 'base',
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.test.ts', '**/*.config.ts'],
    },
  },
  resolve: {
    conditions: ['development', 'import', 'module', 'browser', 'default'],
  },
  plugins: [
    cleanArchitecture(projectManagerArchitectureRules),
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      insertTypesEntry: true,
    }) as any,
  ],
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        'common/logging/index': 'src/common/logging/index.ts',
      },
      name: 'ProjectManagerBase',
      formats: ['es'],
    },
    rollupOptions: {
      external: id => {
        // External all Node.js built-in modules
        if (id.startsWith('node:')) return true
        // External all third-party packages
        return false
      },
    },
    outDir: 'dist',
    sourcemap: true,
    target: 'node18',
  },
})
