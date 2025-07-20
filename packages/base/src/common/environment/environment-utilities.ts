/**
 * Environment-based utility functions
 *
 * Provides convenient utility functions for environment-specific behavior
 * and feature toggles based on the current environment mode.
 *
 * Note: All functions require explicit EnvironmentMode parameter.
 * Environment detection has been moved to Application/Infrastructure layers.
 */

import type { EnvironmentMode } from './environment-mode.ts'
import { getLogLevel, shouldEnableCache, shouldEnableDebug } from './environment-mode.ts'

/**
 * Check if environment supports debug features (alias for shouldEnableDebug)
 */
export function isDebugMode(mode: EnvironmentMode): boolean {
  return shouldEnableDebug(mode)
}

/**
 * Check if environment is development-like (development, testing, isolated)
 */
export function isDevelopmentLike(mode: EnvironmentMode): boolean {
  return mode === 'development' || mode === 'testing' || mode === 'isolated'
}

/**
 * Check if hot reload should be enabled
 */
export function shouldEnableHotReload(mode: EnvironmentMode): boolean {
  return mode === 'development'
}

/**
 * Check if caching should be enabled (alias for shouldEnableCache)
 */
export function isCacheEnabled(mode: EnvironmentMode): boolean {
  return shouldEnableCache(mode)
}

/**
 * Get human-readable environment description for display
 */
export function getEnvironmentDisplayName(mode: EnvironmentMode): string {
  switch (mode) {
    case 'production':
      return 'production'
    case 'development':
      return 'development'
    case 'testing':
      return 'testing'
    case 'in-memory':
      return 'in-memory'
    case 'isolated':
      return 'isolated'
    default:
      return 'unknown'
  }
}

/**
 * Check if verbose logging should be enabled
 */
export function shouldLogVerbose(mode: EnvironmentMode): boolean {
  const logLevel = getLogLevel(mode)
  return logLevel === 'debug' || logLevel === 'info'
}

/**
 * Check if errors should be logged
 */
export function shouldLogErrors(mode: EnvironmentMode): boolean {
  const logLevel = getLogLevel(mode)
  return logLevel !== 'silent'
}
