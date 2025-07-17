import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { cleanArchitecture } from '../../etc/vite/plugins/architecture-fitness.ts'

export default defineConfig({
  plugins: [
    cleanArchitecture({
      layers: [
        {
          name: 'domain',
          patterns: ['**/domain/**', '**/entities/**', '**/value-objects/**'],
          allowedDependencies: ['shared'],
          description: 'Core business logic, entities, value objects',
        },
        {
          name: 'application',
          patterns: ['**/application/**', '**/usecases/**', '**/dtos/**'],
          allowedDependencies: ['domain', 'shared'],
          description: 'Use cases, application services, DTOs',
        },
        {
          name: 'infrastructure',
          patterns: ['**/infrastructure/**', '**/adapters/**', '**/container/**'],
          allowedDependencies: ['application', 'domain', 'shared'],
          description: 'External services, file storage, dependency injection',
        },
        {
          name: 'shared',
          patterns: ['**/shared/**'],
          allowedDependencies: [],
          description: 'Common utilities, patterns, base classes',
        },
      ],
      exports: [
        {
          pattern: '**/src/index.ts',
          forbidden: ['**/infrastructure/**', '**/container/**'],
          message: 'Core package should only export domain and application layers',
        },
      ],
      imports: [
        {
          pattern: '**/domain/**',
          forbidden: ['**/infrastructure/**', '**/application/**'],
          message: 'Domain layer must be pure - no dependencies on outer layers',
        },
      ],
    }),
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
      external: [
        '@project-manager/shared',
        'node:fs/promises',
        'node:fs',
        'node:path',
        'node:os',
        'node:crypto',
      ],
    },
    outDir: 'dist',
    sourcemap: true,
    target: 'node18',
  },
})
