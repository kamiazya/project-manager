import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  test: {
    name: 'domain',
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
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
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ProjectManagerDomain',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['@project-manager/base', 'node:crypto', 'node:fs', 'node:path', 'node:os'],
      output: {
        globals: {
          '@project-manager/base': 'ProjectManagerBase',
        },
      },
    },
    outDir: 'dist',
    sourcemap: true,
    target: 'node18',
    ssr: true,
  },
})
