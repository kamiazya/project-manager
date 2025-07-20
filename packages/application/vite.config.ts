/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  test: {
    name: 'application',
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
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
      name: 'ProjectManagerApplication',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        '@project-manager/domain',
        '@project-manager/base',
        'node:fs/promises',
        'node:fs',
        'node:path',
        'node:os',
        'node:crypto',
      ],
    },
    outDir: 'dist',
    sourcemap: true,
    target: 'node18',
    ssr: true,
  },
})
