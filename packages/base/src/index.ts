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

// Error types (Common Infrastructure)
export {
  BaseError,
  ConfigurationError,
  EnvironmentConfigurationError,
  ValidationError,
} from './common/errors/base-errors.ts'

// Configuration defaults (Common Infrastructure)

// Configuration schemas (Shared Kernel)

// Environment Management (Common Infrastructure)
// Note: Environment detection moved to Application/Infrastructure layers
export type { EnvironmentMode, EnvironmentProfile } from './common/environment/environment-mode.ts'
export {
  ENVIRONMENT_PROFILES,
  getEnvironmentProfile,
  getLogLevel,
  getStorageDir,
  isFileEnvironment,
  isMemoryEnvironment,
  shouldEnableCache,
  shouldEnableDebug,
} from './common/environment/environment-mode.ts'
export {
  getEnvironmentDisplayName,
  isCacheEnabled,
  isDebugMode,
  isDevelopmentLike,
  shouldEnableHotReload,
  shouldLogErrors,
  shouldLogVerbose,
} from './common/environment/environment-utilities.ts'

// Type System (Shared Kernel)
export * from './kernel/types/branded-types.ts'
export * from './kernel/types/utility-types.ts'
