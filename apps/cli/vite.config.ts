/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { cleanArchitecture } from '../../etc/vite/plugins/architecture-fitness.ts'

export default defineConfig({
  test: {
    name: 'cli',
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
  resolve: {
    conditions: ['@project-manager/source', 'import', 'module', 'browser', 'default'],
  },
  plugins: [
    cleanArchitecture({
      layers: [
        {
          name: 'presentation',
          patterns: ['**/commands/**', '**/hooks/**', '**/bin/**'],
          allowedDependencies: ['application', 'domain', 'shared'],
          description: 'CLI commands, hooks, and entry points',
        },
        {
          name: 'application',
          patterns: ['**/lib/**', '**/utils/**'],
          allowedDependencies: ['domain', 'shared'],
          description: 'CLI application logic and utilities',
        },
        {
          name: 'shared',
          patterns: ['**/shared/**'],
          allowedDependencies: [],
          description: 'Common utilities and patterns',
        },
      ],
      imports: [
        {
          pattern: '**/commands/**',
          forbidden: ['**/infrastructure/**'],
          message: 'CLI commands should not directly import infrastructure implementations',
        },
        {
          pattern: '**/lib/**',
          forbidden: ['**/infrastructure/**'],
          message: 'CLI utilities should not directly import infrastructure implementations',
        },
      ],
    }),
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      insertTypesEntry: true,
    }) as any,
  ],
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        'bin/run': 'src/bin/run.ts',
        'commands/create': 'src/commands/create.ts',
        'commands/delete': 'src/commands/delete.ts',
        'commands/list': 'src/commands/list.ts',
        'commands/show': 'src/commands/show.ts',
        'commands/update': 'src/commands/update.ts',
        'commands/mcp': 'src/commands/mcp.ts',
        'lib/base-command': 'src/lib/base-command.ts',
        'hooks/init/plugin-support': 'src/hooks/init/plugin-support.ts',
        'hooks/postrun/cleanup': 'src/hooks/postrun/cleanup.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        '@project-manager/application',
        '@project-manager/base',
        '@project-manager/domain',
        '@project-manager/mcp-server',
        '@modelcontextprotocol/sdk/server/stdio.js',
        '@oclif/core',
        '@oclif/plugin-help',
        '@oclif/plugin-plugins',
        '@oclif/plugin-autocomplete',
        '@inquirer/prompts',
        'chalk',
        'node:fs',
        'node:fs/promises',
        'node:path',
        'node:os',
        'node:url',
        'node:child_process',
      ],
      output: {
        banner: chunk => {
          if (chunk.name === 'bin/run') {
            return '#!/usr/bin/env node'
          }
          return ''
        },
      },
    },
    outDir: 'dist',
    sourcemap: true,
    target: 'node18',
    ssr: true,
  },
})
