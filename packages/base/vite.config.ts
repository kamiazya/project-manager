/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

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
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      insertTypesEntry: true,
    }) as any,
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'ProjectManagerBase',
      fileName: 'index',
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
