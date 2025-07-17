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
      external: id => {
        // External all Node.js built-in modules and their sub-paths
        if (id.startsWith('node:')) return true
        // External all our internal packages
        if (id.startsWith('@project-manager/')) return true
        // External all third-party packages
        return [
          '@modelcontextprotocol/sdk',
          'zod',
          'async_hooks',
          'buffer',
          'string_decoder',
          'inversify',
          'raw-body',
          'content-type',
          'safer-buffer',
          'iconv-lite',
        ].includes(id)
      },
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
