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
    target: 'node18',
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
        '@modelcontextprotocol/sdk/server/index.ts',
        '@modelcontextprotocol/sdk/server/stdio.ts',
        'zod',
        '@project-manager/core',
        '@project-manager/shared',
        'node:fs',
        'node:path',
        'node:url',
        'node:os',
        'node:child_process',
        'node:crypto',
        'node:http',
        'async_hooks',
        'buffer',
        'string_decoder',
        'inversify',
        'raw-body',
        'content-type',
        'safer-buffer',
        'iconv-lite',
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
