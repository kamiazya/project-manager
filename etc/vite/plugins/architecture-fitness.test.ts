import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { describe, expect, it } from 'vitest'
import { type ArchitectureRules, architectureFitnessPlugin } from './architecture-fitness'

// A simplified version of the plugin's resolveId for testing
async function testResolveId(plugin: Plugin, source: string, importer: string) {
  const resolver = plugin.resolveId
  if (typeof resolver !== 'function') {
    throw new Error('resolveId function not found on plugin')
  }
  // We need to bind the context `this` to a mock object
  const context = {
    meta: {
      watchMode: true,
    },
  }
  // The third argument is `options`, which we can ignore for now.
  await resolver.call(context, source, importer, { isEntry: false })
}

// A simplified version of the plugin's transform for testing
async function testTransform(plugin: Plugin, code: string, id: string) {
  const transformer = plugin.transform
  if (typeof transformer !== 'function') {
    throw new Error('transform function not found on plugin')
  }
  const context = {
    meta: {
      watchMode: true,
    },
  }
  await transformer.call(context, code, id)
}

const mockRules: ArchitectureRules = {
  layers: [
    { name: 'presentation', patterns: ['**/apps/**'], allowedDependencies: ['sdk'] },
    {
      name: 'sdk',
      patterns: ['**/packages/sdk/**'],
      allowedDependencies: ['application', 'domain', 'infrastructure', 'base'],
    },
    {
      name: 'infrastructure',
      patterns: ['**/packages/infrastructure/**'],
      allowedDependencies: ['application', 'domain', 'base'],
    },
    {
      name: 'application',
      patterns: ['**/packages/application/**'],
      allowedDependencies: ['domain', 'base'],
    },
    { name: 'domain', patterns: ['**/packages/domain/**'], allowedDependencies: ['base'] },
    { name: 'base', patterns: ['**/packages/base/**'], allowedDependencies: [] },
  ],
  imports: [
    {
      pattern: '**/packages/domain/**',
      forbidden: ['**/packages/infrastructure/**'],
      message: 'Domain cannot import from infrastructure.',
    },
    {
      pattern: '**/apps/**',
      forbidden: [
        '**/packages/domain/**',
        '**/packages/application/**',
        '**/packages/infrastructure/**',
      ],
      message: 'Apps can only import from SDK.',
    },
  ],
  exports: [
    {
      pattern: '**/packages/base/index.ts',
      forbidden: ['**/packages/domain/**'],
      message: 'Base package cannot export from domain.',
    },
  ],
  checks: {
    layerViolations: true,
    importViolations: true,
    exportViolations: true,
  },
}

// Absolute paths for realistic testing with new monorepo structure
const baseDir = resolve(process.cwd(), 'project')
const presentationFile = resolve(baseDir, 'apps/cli/src/command.ts')
const sdkFile = resolve(baseDir, 'packages/sdk/src/index.ts')
const infrastructureFile = resolve(baseDir, 'packages/infrastructure/src/repository.ts')
const applicationFile = resolve(baseDir, 'packages/application/src/service.ts')
const domainFile = resolve(baseDir, 'packages/domain/src/entity.ts')
const baseFile = resolve(baseDir, 'packages/base/src/utils.ts')
const baseIndexFile = resolve(baseDir, 'packages/base/index.ts')

describe('architectureFitnessPlugin', () => {
  describe('Layer Violations', () => {
    const plugin = architectureFitnessPlugin(mockRules)

    it('should not throw for allowed dependencies', async () => {
      // application -> domain
      await expect(
        testResolveId(plugin, '../domain/entity', applicationFile)
      ).resolves.not.toThrow()

      // infrastructure -> application
      await expect(
        testResolveId(plugin, '../application/service', infrastructureFile)
      ).resolves.not.toThrow()

      // apps -> sdk
      await expect(
        testResolveId(plugin, '../../packages/sdk/src/index', presentationFile)
      ).resolves.not.toThrow()
    })

    it('should throw for disallowed dependencies', async () => {
      // domain -> application (absolute path to ensure pattern matching)
      const importPath = resolve(baseDir, 'packages/application/src/service.ts')
      await expect(testResolveId(plugin, importPath, domainFile)).rejects.toThrow(
        /Architecture Violation \(Layer Boundary\)/
      )
    })

    it('should throw a correctly formatted error message for layer violations', async () => {
      // domain -> infrastructure (absolute path to ensure pattern matching)
      const importPath = resolve(baseDir, 'packages/infrastructure/src/repository.ts')
      await expect(testResolveId(plugin, importPath, domainFile)).rejects.toThrow(
        'domain layer cannot import from infrastructure layer'
      )
    })
  })

  describe('Import Violations', () => {
    // Create a special set of rules for this test to isolate import violations
    // from layer violations.
    const importTestRules: ArchitectureRules = {
      ...mockRules,
      layers: [
        // Remove the original 'presentation' layer and add a new one
        ...mockRules.layers.filter(l => l.name !== 'presentation'),
        {
          name: 'presentation',
          patterns: ['**/apps/**'],
          // Allow depending on infrastructure ONLY for this test suite
          allowedDependencies: ['sdk', 'infrastructure'],
        },
      ],
      // Also, the original import rule was for the domain layer.
      // We need a rule that applies to the presentation layer for this test.
      imports: [
        {
          pattern: '**/apps/**',
          forbidden: ['**/packages/infrastructure/**'],
          message: 'Apps cannot import directly from infrastructure.',
        },
      ],
    }
    const plugin = architectureFitnessPlugin(importTestRules)

    it('should throw for forbidden imports when layer dependency is allowed', async () => {
      const importPath = '../../packages/infrastructure/src/repository.ts'
      await expect(testResolveId(plugin, importPath, presentationFile)).rejects.toThrow(
        /Architecture Violation \(Import Restriction\)/
      )
    })

    it('should use the custom message for import violations', async () => {
      const importPath = '../../packages/infrastructure/src/repository.ts'
      await expect(testResolveId(plugin, importPath, presentationFile)).rejects.toThrow(
        'Apps cannot import directly from infrastructure.'
      )
    })

    it('should not throw for allowed imports', async () => {
      // This import is allowed by both layer and import rules.
      const importPath = '../../packages/sdk/src/index.ts'
      await expect(testResolveId(plugin, importPath, presentationFile)).resolves.not.toThrow()
    })
  })

  describe('Export Violations', () => {
    const plugin = architectureFitnessPlugin(mockRules)

    it('should throw for forbidden exports', async () => {
      const code = `export { MyEntity } from './packages/domain/entity.ts'`
      await expect(testTransform(plugin, code, baseIndexFile)).rejects.toThrow(
        /Architecture Violation \(Export Restriction\)/
      )
    })

    it('should use the custom message for export violations', async () => {
      const code = `export { MyEntity } from './packages/domain/entity.ts'`
      await expect(testTransform(plugin, code, baseIndexFile)).rejects.toThrow(
        'Base package cannot export from domain.'
      )
    })

    it('should not throw for allowed exports', async () => {
      const code = `export { myUtil } from './src/utils.ts'`
      await expect(testTransform(plugin, code, baseIndexFile)).resolves.not.toThrow()
    })
  })

  describe('Plugin Configuration', () => {
    it('should not check disabled violations', async () => {
      const disabledRules: ArchitectureRules = {
        ...mockRules,
        checks: {
          layerViolations: false,
          importViolations: false,
          exportViolations: false,
        },
      }
      const plugin = architectureFitnessPlugin(disabledRules)

      // Test a layer violation - should not throw
      await expect(
        testResolveId(plugin, '../application/service.ts', domainFile)
      ).resolves.not.toThrow()

      // Test an import violation - should not throw
      await expect(
        testResolveId(plugin, '../infrastructure/repository.ts', domainFile)
      ).resolves.not.toThrow()

      // Test an export violation - should not throw
      const code = `export { MyEntity } from './packages/domain/entity.ts'`
      await expect(testTransform(plugin, code, baseIndexFile)).resolves.not.toThrow()
    })
  })
})
