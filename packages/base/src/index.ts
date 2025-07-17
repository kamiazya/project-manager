/**
 * @project-manager/base
 *
 * Base package containing Shared Kernel and Common Infrastructure patterns
 * for the Project Manager system.
 *
 * This package provides:
 * - Shared Kernel: Domain knowledge shared across bounded contexts
 * - Common Infrastructure: Technical infrastructure shared across layers
 */

// Re-export all public APIs - Direct imports (no index.ts files)

// Configuration defaults (Common Infrastructure)
export * from './common/configuration/defaults/app-defaults.ts'
export * from './common/configuration/defaults/storage-defaults.ts'
export * from './common/configuration/defaults/ticket-defaults.ts'
export * from './common/configuration/defaults/ui-defaults.ts'
// Configuration factory (Common Infrastructure)
export * from './common/configuration/factory/configuration-factory.ts'
export * from './common/configuration/factory/type-safe-factory.ts'
// Configuration infrastructure (Common Infrastructure)
export * from './common/configuration/loaders/configuration-loader.ts'
export * from './common/configuration/loaders/environment-loader.ts'
export * from './common/configuration/loaders/json-file-loader.ts'
export * from './common/configuration/loaders/override-loader.ts'
export * from './common/configuration/resolvers/cascading-resolver.ts'
// Configuration schemas (Shared Kernel)
export * from './kernel/configuration/schemas/app-config.ts'
export * from './kernel/configuration/schemas/storage-config.ts'
export * from './kernel/configuration/schemas/ticket-config.ts'
export * from './kernel/configuration/schemas/ui-config.ts'

// Type System (Shared Kernel)
export * from './kernel/types/branded-types.ts'
export * from './kernel/types/result-types.ts'
export * from './kernel/types/utility-types.ts'

// Placeholder exports for future implementation
export type SharedTypes = {}
export type DomainEvents = {}
export type CommonErrors = {}
export type CommonLogging = {}
export type CommonPatterns = {}
export type CommonUtils = {}
