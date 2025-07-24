/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { projectManagerArchitectureRules } from '../../etc/vite/architecture.config.ts'
import {
  type ArchitectureRules,
  cleanArchitecture,
} from '../../etc/vite/plugins/architecture-fitness.ts'

// CLI アプリケーション内部のアーキテクチャルール
const cliInternalRules: Partial<ArchitectureRules> = {
  layers: [
    {
      name: 'cli-presentation',
      patterns: [
        '**/apps/cli/src/commands/**',
        '**/apps/cli/src/hooks/**',
        '**/apps/cli/src/bin/**',
      ],
      allowedDependencies: ['cli-application', 'sdk'],
      description: 'CLI commands, hooks, and entry points',
    },
    {
      name: 'cli-application',
      patterns: ['**/apps/cli/src/lib/**', '**/apps/cli/src/utils/**'],
      allowedDependencies: ['sdk'],
      description: 'CLI application logic and utilities',
    },
  ],
  imports: [
    {
      pattern: '**/apps/cli/src/commands/**/!(mcp).ts',
      forbidden: [
        '**/packages/infrastructure/**',
        '**/packages/application/**',
        '**/packages/domain/**',
        '**/packages/base/**',
      ],
      message: 'CLI commands should only import from SDK layer',
    },
    {
      pattern: '**/apps/cli/src/lib/**',
      forbidden: [
        '**/packages/infrastructure/**',
        '**/packages/application/**',
        '**/packages/domain/**',
        '**/packages/base/**',
      ],
      message: 'CLI utilities should only import from SDK layer',
    },
  ],
}

export default defineConfig({
  test: {
    name: 'cli',
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
  resolve: {
    conditions: ['development', 'import', 'module', 'browser', 'default'],
  },
  plugins: [
    cleanArchitecture(projectManagerArchitectureRules, cliInternalRules),
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
        'commands/update/content': 'src/commands/update/content.ts',
        'commands/update/priority': 'src/commands/update/priority.ts',
        'commands/update/status': 'src/commands/update/status.ts',
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
        /^@project-manager\/base\//,
        /^@project-manager\/application\//,
        /^@project-manager\/domain\//,
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
