import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    dts({
      rollupTypes: true,
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'bin/mcp-server': resolve(__dirname, 'src/bin/mcp-server.ts'),
      },
      name: '@project-manager/mcp-server',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        '@modelcontextprotocol/sdk',
        '@modelcontextprotocol/sdk/server/index.js',
        '@modelcontextprotocol/sdk/server/stdio.js',
        'zod',
        '@project-manager/core',
        '@project-manager/shared',
        'node:fs',
        'node:path',
        'node:url',
        'node:os',
        'node:child_process',
        'reflect-metadata',
        'inversify',
      ],
      output: {
        banner: chunk => {
          if (chunk.name === 'bin/mcp-server') {
            return '#!/usr/bin/env node'
          }
          return ''
        },
      },
    },
  },
})
