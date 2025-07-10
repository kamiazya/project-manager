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
      entry: {
        index: 'src/index.ts',
        'bin/pm': 'src/bin/pm.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        '@project-manager/core',
        '@project-manager/shared',
        'commander',
        'chalk',
        'node:fs',
        'node:path',
        'node:os',
        'node:url',
      ],
      output: {
        banner: chunk => {
          if (chunk.name === 'bin/pm') {
            return '#!/usr/bin/env node'
          }
          return ''
        },
      },
    },
    outDir: 'dist',
    sourcemap: true,
    target: 'node18',
  },
})
