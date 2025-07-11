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
      name: 'ProjectManagerShared',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [/node:.+/],
    },
    outDir: 'dist',
    sourcemap: true,
    target: 'node18',
  },
})
