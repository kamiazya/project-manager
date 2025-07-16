import { dirname, relative, resolve } from 'node:path'
import type { Plugin } from 'vite'

/**
 * Configuration for architecture fitness rules
 */
export interface ArchitectureRules {
  /** Layer definitions with allowed dependencies */
  layers: LayerDefinition[]
  /** Specific export rules for packages */
  exports?: ExportRule[]
  /** Import restrictions */
  imports?: ImportRule[]
  /** Enable/disable specific checks */
  checks?: {
    layerViolations?: boolean
    exportViolations?: boolean
    importViolations?: boolean
    circularDependencies?: boolean
  }
}

export interface LayerDefinition {
  /** Layer name (e.g., 'domain', 'application') */
  name: string
  /** File path patterns that belong to this layer */
  patterns: string[]
  /** Layers this layer is allowed to depend on */
  allowedDependencies: string[]
  /** Optional description for error messages */
  description?: string
}

export interface ExportRule {
  /** Package or file pattern */
  pattern: string
  /** Paths that are forbidden to export */
  forbidden: string[]
  /** Optional custom error message */
  message?: string
}

export interface ImportRule {
  /** File pattern that this rule applies to */
  pattern: string
  /** Paths that are forbidden to import */
  forbidden: string[]
  /** Optional custom error message */
  message?: string
}

/**
 * Vite plugin for enforcing Clean Architecture fitness rules
 */
export function architectureFitnessPlugin(rules: ArchitectureRules): Plugin {
  const {
    layers,
    exports: exportRules = [],
    imports: importRules = [],
    checks = {
      layerViolations: true,
      exportViolations: true,
      importViolations: true,
      circularDependencies: false,
    },
  } = rules

  // Helper functions
  const detectLayer = (filePath: string): LayerDefinition | null => {
    const normalizedPath = filePath.replace(/\\/g, '/')
    return (
      layers.find(layer =>
        layer.patterns.some(pattern => {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'))
          return regex.test(normalizedPath)
        })
      ) || null
    )
  }

  const isAllowedDependency = (fromLayer: LayerDefinition, toLayer: LayerDefinition): boolean => {
    return fromLayer.allowedDependencies.includes(toLayer.name)
  }

  const matchesPattern = (path: string, pattern: string): boolean => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    return regex.test(path.replace(/\\/g, '/'))
  }

  const formatPath = (path: string): string => {
    return relative(process.cwd(), path).replace(/\\/g, '/')
  }

  const createViolationError = (
    type: string,
    message: string,
    importer?: string,
    imported?: string
  ): void => {
    const details: string[] = []
    if (importer) details.push(`  From: ${formatPath(importer)}`)
    if (imported) details.push(`  To: ${formatPath(imported)}`)

    const fullMessage = [
      `🏗️  Architecture Violation (${type}):`,
      `  ${message}`,
      ...details,
      '',
      '💡 Suggestion: Review Clean Architecture principles and layer boundaries',
    ].join('\n')

    throw new Error(fullMessage)
  }

  return {
    name: 'vite-plugin-architecture-fitness',
    enforce: 'pre', // Run before other plugins

    // Hook into module resolution
    async resolveId(source: string, importer?: string) {
      if (!importer) return null

      // Skip node_modules and virtual modules
      if (source.startsWith('virtual:') || source.includes('node_modules')) {
        return null
      }

      try {
        // Resolve the absolute path of the imported module
        const resolvedPath = resolve(dirname(importer), source)

        // Check layer violations
        if (checks.layerViolations) {
          const importerLayer = detectLayer(importer)
          const importedLayer = detectLayer(resolvedPath)

          if (importerLayer && importedLayer && importerLayer !== importedLayer) {
            if (!isAllowedDependency(importerLayer, importedLayer)) {
              createViolationError(
                'Layer Boundary',
                `${importerLayer.name} layer cannot import from ${importedLayer.name} layer`,
                importer,
                resolvedPath
              )
            }
          }
        }

        // Check import rules
        if (checks.importViolations) {
          for (const rule of importRules) {
            if (matchesPattern(importer, rule.pattern)) {
              for (const forbidden of rule.forbidden) {
                if (matchesPattern(resolvedPath, forbidden)) {
                  createViolationError(
                    'Import Restriction',
                    rule.message || `Import from ${forbidden} is forbidden`,
                    importer,
                    resolvedPath
                  )
                }
              }
            }
          }
        }
      } catch (error) {
        // If we can't resolve the path, let other plugins handle it
        if (error instanceof Error && !error.message.includes('Architecture Violation')) {
          return null
        }
        throw error
      }

      return null // Let other plugins handle the resolution
    },

    // Hook into code transformation
    async transform(code: string, id: string) {
      // Check export violations for specific files
      if (checks.exportViolations) {
        for (const rule of exportRules) {
          if (matchesPattern(id, rule.pattern)) {
            // Simple regex to detect exports (can be enhanced with AST parsing)
            const exportRegex = /export\s+.*?from\s+['"]([^'"]+)['"]/g
            let match: RegExpExecArray | null = null

            // biome-ignore lint/suspicious/noAssignInExpressions: Common pattern for regex matching
            while ((match = exportRegex.exec(code)) !== null) {
              const exportedPath = match[1]

              for (const forbidden of rule.forbidden) {
                if (matchesPattern(exportedPath, forbidden)) {
                  createViolationError(
                    'Export Restriction',
                    rule.message || `Export from ${forbidden} is forbidden`,
                    id,
                    exportedPath
                  )
                }
              }
            }
          }
        }
      }

      return null // Don't transform the code, just analyze it
    },

    // Development server integration
    configureServer(server) {
      // Add custom error overlay for architecture violations
      server.middlewares.use('/__architecture_fitness', (req, res, next) => {
        if (req.url === '/__architecture_fitness/status') {
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              status: 'active',
              rules: {
                layers: layers.length,
                exports: exportRules.length,
                imports: importRules.length,
                checks,
              },
            })
          )
        } else {
          next()
        }
      })

      // Log plugin status
      server.config.logger.info('🏗️  Architecture Fitness Plugin enabled')
      server.config.logger.info(`   Layers: ${layers.map(l => l.name).join(', ')}`)
    },

    // Build start hook
    buildStart() {
      this.info('🏗️  Architecture Fitness: Validating project structure...')
    },

    // Build end hook
    buildEnd() {
      this.info('🏗️  Architecture Fitness: Validation complete')
    },
  }
}

/**
 * Default configuration for Clean Architecture
 */
export const cleanArchitectureRules: ArchitectureRules = {
  layers: [
    {
      name: 'presentation',
      patterns: ['**/cli/**', '**/mcp-server/**', '**/apps/**'],
      allowedDependencies: ['application', 'domain', 'shared'],
      description: 'User interface layer - CLI, web, API endpoints',
    },
    {
      name: 'infrastructure',
      patterns: ['**/infrastructure/**', '**/adapters/**', '**/external/**'],
      allowedDependencies: ['application', 'domain', 'shared'],
      description: 'External services, databases, file systems',
    },
    {
      name: 'application',
      patterns: ['**/application/**', '**/usecases/**', '**/services/**'],
      allowedDependencies: ['domain', 'shared'],
      description: 'Business logic orchestration, use cases',
    },
    {
      name: 'domain',
      patterns: ['**/domain/**', '**/entities/**', '**/value-objects/**'],
      allowedDependencies: ['shared'],
      description: 'Core business logic, entities, value objects',
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
      pattern: '**/core/src/index.ts',
      forbidden: ['**/infrastructure/**'],
      message: 'Core package should not export infrastructure implementations',
    },
  ],
  imports: [
    {
      pattern: '**/domain/**',
      forbidden: ['**/infrastructure/**', '**/presentation/**'],
      message: 'Domain layer must remain pure and not depend on outer layers',
    },
  ],
  checks: {
    layerViolations: true,
    exportViolations: true,
    importViolations: true,
    circularDependencies: false,
  },
}

/**
 * Convenience function for Clean Architecture setup
 */
export function cleanArchitecture(customRules?: Partial<ArchitectureRules>): Plugin {
  const rules = customRules
    ? {
        ...cleanArchitectureRules,
        ...customRules,
        layers: customRules.layers || cleanArchitectureRules.layers,
        exports: customRules.exports || cleanArchitectureRules.exports,
        imports: customRules.imports || cleanArchitectureRules.imports,
        checks: { ...cleanArchitectureRules.checks, ...customRules.checks },
      }
    : cleanArchitectureRules

  return architectureFitnessPlugin(rules)
}

export default architectureFitnessPlugin
