/// <reference types="vitest/config" />
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { projectManagerArchitectureRules } from '../../etc/vite/architecture.config.ts'
import { licenseBanner } from '../../etc/vite/license-banner.ts'
import { cleanArchitecture } from '../../etc/vite/plugins/architecture-fitness.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    name: 'mcp-server',
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
  resolve: {
    conditions: ['development', 'import', 'module', 'browser', 'default'],
  },
  plugins: [
    cleanArchitecture(projectManagerArchitectureRules),
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
        return ['@modelcontextprotocol/sdk', 'zod'].includes(id) || id.startsWith('@duckdb/')
      },
      output: {
        banner: chunk => {
          if (chunk.name === 'bin/mcp-server') {
            return `#!/usr/bin/env node\n${licenseBanner}`
          }
          return licenseBanner
        },
      },
    },
  },
})
