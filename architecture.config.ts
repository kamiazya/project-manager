import type { ArchitectureRules } from './vite-plugin-architecture-fitness.ts'

/**
 * Architecture fitness rules configuration for project-manager
 */
export const projectManagerArchitectureRules: ArchitectureRules = {
  layers: [
    {
      name: 'presentation',
      patterns: ['**/packages/cli/**', '**/packages/mcp-server/**', '**/apps/**'],
      allowedDependencies: ['application', 'domain', 'shared'],
      description: 'User interface layer - CLI commands, MCP server tools',
    },
    {
      name: 'infrastructure',
      patterns: [
        '**/packages/core/src/infrastructure/**',
        '**/packages/infrastructure/**',
        '**/adapters/**',
        '**/persistence/**',
        '**/external/**',
      ],
      allowedDependencies: ['application', 'domain', 'shared'],
      description: 'External services, file storage, dependency injection',
    },
    {
      name: 'application',
      patterns: [
        '**/packages/core/src/application/**',
        '**/usecases/**',
        '**/services/**',
        '**/dtos/**',
      ],
      allowedDependencies: ['domain', 'shared'],
      description: 'Use cases, application services, DTOs',
    },
    {
      name: 'domain',
      patterns: [
        '**/packages/core/src/domain/**',
        '**/entities/**',
        '**/value-objects/**',
        '**/domain-events/**',
      ],
      allowedDependencies: ['shared'],
      description: 'Core business logic, entities, value objects',
    },
    {
      name: 'shared',
      patterns: ['**/packages/shared/**', '**/packages/*/src/shared/**'],
      allowedDependencies: [],
      description: 'Common utilities, patterns, base classes',
    },
  ],
  exports: [
    {
      pattern: '**/packages/core/src/index.ts',
      forbidden: ['**/infrastructure/**', '**/adapters/**', '**/container/**'],
      message:
        'Core package should not export infrastructure implementations. Use dependency injection instead.',
    },
    {
      pattern: '**/packages/shared/src/index.ts',
      forbidden: ['**/infrastructure/**', '**/application/**', '**/domain/**'],
      message: 'Shared package should only export generic utilities, not business logic',
    },
  ],
  imports: [
    {
      pattern: '**/packages/core/src/domain/**',
      forbidden: [
        '**/infrastructure/**',
        '**/presentation/**',
        '**/packages/cli/**',
        '**/packages/mcp-server/**',
      ],
      message: 'Domain layer must remain pure and not depend on outer layers',
    },
    {
      pattern: '**/packages/core/src/application/**',
      forbidden: [
        '**/infrastructure/**',
        '**/presentation/**',
        '**/packages/cli/**',
        '**/packages/mcp-server/**',
      ],
      message: 'Application layer should not depend on infrastructure implementations',
    },
    {
      pattern: '**/packages/shared/**',
      forbidden: ['**/packages/core/**', '**/packages/cli/**', '**/packages/mcp-server/**'],
      message: 'Shared utilities should not depend on business logic packages',
    },
  ],
  checks: {
    layerViolations: true,
    exportViolations: true,
    importViolations: true,
    circularDependencies: false, // Enable later when needed
  },
}

/**
 * Simplified rules for specific contexts
 */
export const corePackageRules: ArchitectureRules = {
  layers: projectManagerArchitectureRules.layers,
  exports: [
    {
      pattern: '**/packages/core/src/index.ts',
      forbidden: ['**/infrastructure/**', '**/container/**'],
      message: 'Core package should only export domain and application layers',
    },
  ],
  imports: [
    {
      pattern: '**/packages/core/src/domain/**',
      forbidden: ['**/infrastructure/**', '**/application/**'],
      message: 'Domain layer must be pure - no dependencies on outer layers',
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
 * Development-friendly rules (less strict for experimentation)
 */
export const developmentRules: ArchitectureRules = {
  ...projectManagerArchitectureRules,
  checks: {
    layerViolations: true,
    exportViolations: false, // Allow temporary violations during development
    importViolations: true,
    circularDependencies: false,
  },
}

export default projectManagerArchitectureRules
