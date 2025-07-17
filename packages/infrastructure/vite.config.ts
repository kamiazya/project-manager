import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  test: {
    name: 'infrastructure',
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
  resolve: {
    conditions: ['@project-manager/source', 'import', 'module', 'browser', 'default'],
  },
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
      name: 'ProjectManagerInfrastructure',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        '@project-manager/application',
        '@project-manager/domain',
        '@project-manager/base',
        'inversify',
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
    ssr: true,
  },
})
