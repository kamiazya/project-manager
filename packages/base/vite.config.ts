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
        'kernel/configuration/index': 'src/kernel/configuration/index.ts',
        'kernel/configuration/schemas/index': 'src/kernel/configuration/schemas/index.ts',
        'kernel/events/index': 'src/kernel/events/index.ts',
        'kernel/types/index': 'src/kernel/types/index.ts',
        'common/configuration/index': 'src/common/configuration/index.ts',
        'common/patterns/index': 'src/common/patterns/index.ts',
        'common/errors/index': 'src/common/errors/index.ts',
        'common/utils/index': 'src/common/utils/index.ts',
        'common/logging/index': 'src/common/logging/index.ts',
      },
      name: 'ProjectManagerBase',
      formats: ['es'],
    },
    rollupOptions: {
      external: id => {
        // External all Node.js built-in modules
        if (id.startsWith('node:')) return true
        // External all third-party packages
        return false
      },
    },
    outDir: 'dist',
    sourcemap: true,
    target: 'node18',
  },
})
