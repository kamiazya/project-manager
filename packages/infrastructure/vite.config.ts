/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { projectManagerArchitectureRules } from '../../etc/vite/architecture.config.ts'
import { cleanArchitecture } from '../../etc/vite/plugins/architecture-fitness.ts'

export default defineConfig({
  test: {
    name: 'infrastructure',
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
  resolve: {
    conditions: ['development', 'import', 'module', 'browser', 'default'],
  },
  plugins: [
    cleanArchitecture(projectManagerArchitectureRules),
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
      external: (id: string) => {
        // Node.js built-in modules (comprehensive detection)
        if (id.startsWith('node:')) return true

        // Project manager packages (strict allowlist)
        const allowedPackages = [
          '@project-manager/application',
          '@project-manager/domain',
          '@project-manager/base',
        ] as const

        const allowedSubPaths = ['@project-manager/base/common/logging'] as const

        // Check exact package matches
        if (allowedPackages.includes(id as any)) {
          return true
        }

        // Check allowed sub-paths
        if (allowedSubPaths.includes(id as any)) {
          return true
        }

        // Reject any other @project-manager packages to detect typos/invalid imports
        if (id.startsWith('@project-manager/')) {
          throw new Error(
            `Invalid @project-manager package import: "${id}". Allowed packages: ${[...allowedPackages, ...allowedSubPaths].join(', ')}`
          )
        }

        // External all third-party packages
        return !id.startsWith('.') && !id.startsWith('/')
      },
    },
    outDir: 'dist',
    sourcemap: true,
    target: 'node18',
    ssr: true,
  },
})
