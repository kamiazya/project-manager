import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { describe, expect, it, vi } from 'vitest'
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
    { name: 'domain', patterns: ['**/domain/**'], allowedDependencies: ['shared'] },
    {
      name: 'application',
      patterns: ['**/application/**'],
      allowedDependencies: ['domain', 'shared'],
    },
    {
      name: 'infrastructure',
      patterns: ['**/infrastructure/**'],
      allowedDependencies: ['application', 'domain', 'shared'],
    },
    { name: 'shared', patterns: ['**/shared/**'], allowedDependencies: [] },
  ],
  imports: [
    {
      pattern: '**/domain/**',
      forbidden: ['**/infrastructure/**'],
      message: 'Domain cannot import from infrastructure.',
    },
  ],
  exports: [
    {
      pattern: '**/shared/index.ts',
      forbidden: ['**/domain/**'],
      message: 'Shared index cannot export from domain.',
    },
  ],
  checks: {
    layerViolations: true,
    importViolations: true,
    exportViolations: true,
  },
}

// Absolute paths for realistic testing
const baseDir = resolve(process.cwd(), 'project')
const domainFile = resolve(baseDir, 'src/domain/entity.ts')
const applicationFile = resolve(baseDir, 'src/application/service.ts')
const infrastructureFile = resolve(baseDir, 'src/infrastructure/repository.ts')
const sharedFile = resolve(baseDir, 'src/shared/utils.ts')
const sharedIndexFile = resolve(baseDir, 'src/shared/index.ts')

describe('architectureFitnessPlugin', () => {
  describe('Layer Violations', () => {
    const plugin = architectureFitnessPlugin(mockRules)

    it('should not throw for allowed dependencies', async () => {
      // application -> domain
      await expect(testResolveId(plugin, './domain/entity', applicationFile)).resolves.not.toThrow()

      // infrastructure -> application
      await expect(
        testResolveId(plugin, './application/service', infrastructureFile)
      ).resolves.not.toThrow()
    })

    it('should throw for disallowed dependencies', async () => {
      // domain -> application
      const importPath = '../application/service.ts'
      await expect(testResolveId(plugin, importPath, domainFile)).rejects.toThrow(
        /Architecture Violation \(Layer Boundary\)/
      )
    })

    it('should throw a correctly formatted error message for layer violations', async () => {
      const importPath = '../infrastructure/repository.ts'
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
        // Remove the original 'application' layer and add a new one
        ...mockRules.layers.filter(l => l.name !== 'application'),
        {
          name: 'application',
          patterns: ['**/application/**'],
          // Allow depending on infrastructure ONLY for this test suite
          allowedDependencies: ['domain', 'shared', 'infrastructure'],
        },
      ],
      // Also, the original import rule was for the domain layer.
      // We need a rule that applies to the application layer for this test.
      imports: [
        {
          pattern: '**/application/**',
          forbidden: ['**/infrastructure/**'],
          message: 'Application cannot import directly from infrastructure.',
        },
      ],
    }
    const plugin = architectureFitnessPlugin(importTestRules)

    it('should throw for forbidden imports when layer dependency is allowed', async () => {
      const importPath = '../infrastructure/repository.ts'
      await expect(testResolveId(plugin, importPath, applicationFile)).rejects.toThrow(
        /Architecture Violation \(Import Restriction\)/
      )
    })

    it('should use the custom message for import violations', async () => {
      const importPath = '../infrastructure/repository.ts'
      await expect(testResolveId(plugin, importPath, applicationFile)).rejects.toThrow(
        'Application cannot import directly from infrastructure.'
      )
    })

    it('should not throw for allowed imports', async () => {
      // This import is allowed by both layer and import rules.
      const importPath = '../domain/entity.ts'
      await expect(testResolveId(plugin, importPath, applicationFile)).resolves.not.toThrow()
    })
  })

  describe('Export Violations', () => {
    const plugin = architectureFitnessPlugin(mockRules)

    it('should throw for forbidden exports', async () => {
      const code = `export { MyEntity } from './domain/entity.ts'`
      await expect(testTransform(plugin, code, sharedIndexFile)).rejects.toThrow(
        /Architecture Violation \(Export Restriction\)/
      )
    })

    it('should use the custom message for export violations', async () => {
      const code = `export { MyEntity } from './domain/entity.ts'`
      await expect(testTransform(plugin, code, sharedIndexFile)).rejects.toThrow(
        'Shared index cannot export from domain.'
      )
    })

    it('should not throw for allowed exports', async () => {
      const code = `export { myUtil } from './utils.ts'`
      await expect(testTransform(plugin, code, sharedIndexFile)).resolves.not.toThrow()
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
      const code = `export { MyEntity } from './domain/entity.ts'`
      await expect(testTransform(plugin, code, sharedIndexFile)).resolves.not.toThrow()
    })
  })
})
