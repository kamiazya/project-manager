import type { ArchitectureRules } from './plugins/architecture-fitness.ts'

/**
 * Architecture fitness rules configuration for project-manager
 * Updated for new monorepo structure with apps/ and packages/ separation
 */
export const projectManagerArchitectureRules: ArchitectureRules = {
  layers: [
    {
      name: 'presentation',
      patterns: ['**/apps/**'],
      allowedDependencies: ['sdk', 'application', 'domain', 'infrastructure', 'base'],
      description: 'Applications - CLI (entry point, flexible), MCP Server (SDK only)',
    },
    {
      name: 'sdk',
      patterns: ['**/packages/sdk/**'],
      allowedDependencies: ['application', 'domain', 'infrastructure', 'base'],
      description: 'SDK Facade Layer - provides unified interface to applications',
    },
    {
      name: 'infrastructure',
      patterns: ['**/packages/infrastructure/**'],
      allowedDependencies: ['application', 'domain', 'base'],
      description: 'Infrastructure Layer - repositories, external services, persistence',
    },
    {
      name: 'application',
      patterns: ['**/packages/application/**'],
      allowedDependencies: ['domain', 'base'],
      description: 'Application Layer - use cases, application services, DTOs',
    },
    {
      name: 'domain',
      patterns: ['**/packages/domain/**'],
      allowedDependencies: ['base'],
      description: 'Domain Layer - entities, value objects, domain services',
    },
    {
      name: 'base',
      patterns: ['**/packages/base/**'],
      allowedDependencies: [],
      description: 'Base Layer - Shared Kernel + Common Infrastructure (no dependencies)',
    },
  ],
  exports: [
    {
      pattern: '**/packages/sdk/src/index.ts',
      forbidden: ['**/infrastructure/**/internal/**', '**/infrastructure/**/private/**'],
      message: 'SDK should not export internal infrastructure implementations',
    },
    {
      pattern: '**/packages/base/src/index.ts',
      forbidden: ['**/infrastructure/**', '**/application/**', '**/domain/**'],
      message: 'Base package should only export shared utilities and patterns',
    },
    {
      pattern: '**/packages/domain/src/index.ts',
      forbidden: ['**/infrastructure/**', '**/application/**'],
      message: 'Domain package should not export outer layer implementations',
    },
  ],
  imports: [
    {
      pattern: '**/packages/domain/**',
      forbidden: [
        '**/packages/infrastructure/**',
        '**/packages/application/**',
        '**/packages/sdk/**',
        '**/apps/**',
        'node:*',
      ],
      message: 'Domain layer must remain pure and only depend on base layer',
    },
    {
      pattern: '**/packages/application/**',
      forbidden: ['**/packages/infrastructure/**', '**/packages/sdk/**', '**/apps/**', 'node:*'],
      message: 'Application layer should not depend on infrastructure or outer layers',
    },
    {
      pattern: '**/packages/base/**',
      forbidden: [
        '**/packages/domain/**',
        '**/packages/application/**',
        '**/packages/infrastructure/**',
        '**/packages/sdk/**',
        '**/apps/**',
        'node:*',
      ],
      message: 'Base layer must not depend on any other project layers',
    },
    {
      pattern: '**/packages/sdk/**',
      forbidden: ['**/apps/**', 'node:*'],
      message: 'SDK layer should not depend on Node.js APIs (inversify for DI is allowed)',
    },
    {
      pattern: '**/apps/mcp-server/**',
      forbidden: [
        '**/packages/domain/**',
        '**/packages/application/**',
        '**/packages/infrastructure/**',
        '**/packages/base/**',
      ],
      message: 'MCP Server should only depend on SDK layer',
    },
  ],
  errors: [
    {
      pattern: '**/packages/*/src/**/*.ts',
      forbidden: ['new Error('],
      exceptions: [
        '**/*.{test,spec}.ts',
        '**/test/**',
        '**/tests/**',
        '**/fixtures/**',
        '**/mocks/**',
      ],
      message:
        'Raw Error objects are forbidden in production code. Use domain-specific error classes like ValidationError, ApplicationError, InfrastructureError, etc.',
    },
    {
      pattern: '**/apps/*/src/**/*.ts',
      forbidden: ['new Error('],
      exceptions: [
        '**/*.{test,spec}.ts',
        '**/test/**',
        '**/tests/**',
        '**/fixtures/**',
        '**/mocks/**',
      ],
      message:
        'Raw Error objects are forbidden in production code. Use domain-specific error classes from the SDK layer.',
    },
  ],
  checks: {
    layerViolations: true,
    exportViolations: true,
    importViolations: true,
    errorViolations: true,
    circularDependencies: false, // Enable later when needed
  },
}

/**
 * Simplified rules for specific contexts
 */
export const domainPackageRules: ArchitectureRules = {
  layers: projectManagerArchitectureRules.layers,
  exports: [
    {
      pattern: '**/packages/domain/src/index.ts',
      forbidden: ['**/infrastructure/**', '**/application/**'],
      message: 'Domain package should only export domain layer',
    },
  ],
  imports: [
    {
      pattern: '**/packages/domain/**',
      forbidden: ['**/infrastructure/**', '**/application/**', '**/sdk/**'],
      message: 'Domain layer must be pure - only depend on base layer',
    },
  ],
  errors: projectManagerArchitectureRules.errors,
  checks: {
    layerViolations: true,
    exportViolations: true,
    importViolations: true,
    errorViolations: true,
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
    errorViolations: true, // Keep error violations enabled even in development
    circularDependencies: false,
    skipErrorViolationsInTests: true, // Skip error checks in test files and test mode
  },
}

/**
 * Test-specific rules that disable error violations completely
 */
export const testRules: ArchitectureRules = {
  ...projectManagerArchitectureRules,
  checks: {
    layerViolations: true,
    exportViolations: false,
    importViolations: true,
    errorViolations: false, // Completely disable error violations in test mode
    circularDependencies: false,
  },
}

export default projectManagerArchitectureRules
