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

export * from './common/configuration/index.ts'
export * from './common/errors/index.ts'
export * from './common/logging/index.ts'
export * from './common/patterns/index.ts'
export * from './common/utils/index.ts'
// Re-export all public APIs
export * from './kernel/configuration/index.ts'
export * from './kernel/events/index.ts'
export * from './kernel/types/index.ts'
