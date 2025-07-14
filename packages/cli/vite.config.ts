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
        'bin/run': 'src/bin/run.ts',
        'commands/config': 'src/commands/config.ts',
        'commands/create': 'src/commands/create.ts',
        'commands/delete': 'src/commands/delete.ts',
        'commands/list': 'src/commands/list.ts',
        'commands/quick': 'src/commands/quick.ts',
        'commands/show': 'src/commands/show.ts',
        'commands/stats': 'src/commands/stats.ts',
        'commands/update': 'src/commands/update.ts',
        'commands/mcp': 'src/commands/mcp.ts',
        'lib/base-command': 'src/lib/base-command.ts',
        'hooks/init/dependency-injection': 'src/hooks/init/dependency-injection.ts',
        'hooks/init/config-validation': 'src/hooks/init/config-validation.ts',
        'hooks/init/plugin-support': 'src/hooks/init/plugin-support.ts',
        'hooks/postrun/cleanup': 'src/hooks/postrun/cleanup.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        '@project-manager/core',
        '@project-manager/shared',
        '@project-manager/mcp-server',
        '@modelcontextprotocol/sdk/server/stdio.js',
        '@oclif/core',
        '@oclif/plugin-help',
        '@oclif/plugin-plugins',
        '@oclif/plugin-autocomplete',
        '@inquirer/prompts',
        'inversify',
        'chalk',
        'node:fs',
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
  },
})
