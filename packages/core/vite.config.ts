import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'ProjectManagerCore',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['@project-manager/shared', 'node:fs/promises', 'node:fs', 'node:path'],
    },
    outDir: 'dist',
    sourcemap: true,
    target: 'node18',
  },
})
