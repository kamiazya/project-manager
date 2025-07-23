/**
 * Environment Mode types and configuration profiles
 *
 * Defines the operational modes for the entire Project Manager system,
 * not limited to SDK usage but covering all applications (CLI, MCP Server, etc.)
 */

import { EnvironmentConfigurationError } from '../errors/base-errors.ts'

export type EnvironmentMode = 'production' | 'development' | 'testing' | 'in-memory' | 'isolated'

export interface EnvironmentProfile {
  storageType: 'file' | 'memory'
  storageDir?: string
  enableDebug: boolean
  cacheEnabled: boolean
  logLevel: 'silent' | 'error' | 'info' | 'debug'
}

/**
 * Environment profiles defining behavior for each mode
 */
export const ENVIRONMENT_PROFILES: Record<EnvironmentMode, EnvironmentProfile> = {
  production: {
    storageType: 'file',
    storageDir: 'project-manager',
    enableDebug: false,
    cacheEnabled: true,
    logLevel: 'error',
  },
  development: {
    storageType: 'file',
    storageDir: 'project-manager-dev',
    enableDebug: true,
    cacheEnabled: false,
    logLevel: 'debug',
  },
  testing: {
    storageType: 'memory',
    enableDebug: false,
    cacheEnabled: false,
    logLevel: 'silent',
  },
  'in-memory': {
    storageType: 'memory',
    enableDebug: false,
    cacheEnabled: false,
    logLevel: 'info',
  },
  isolated: {
    storageType: 'file',
    storageDir: 'project-manager-isolated',
    enableDebug: true,
    cacheEnabled: false,
    logLevel: 'info',
  },
}

/**
 * Get profile for a specific environment mode
 */
export function getEnvironmentProfile(mode: EnvironmentMode): EnvironmentProfile {
  return ENVIRONMENT_PROFILES[mode]
}

/**
 * Check if environment mode uses memory storage
 */
export function isMemoryEnvironment(mode: EnvironmentMode): boolean {
  return getEnvironmentProfile(mode).storageType === 'memory'
}

/**
 * Check if environment mode uses file storage
 */
export function isFileEnvironment(mode: EnvironmentMode): boolean {
  return getEnvironmentProfile(mode).storageType === 'file'
}

/**
 * Get storage directory name for file-based environments
 */
export function getStorageDir(mode: EnvironmentMode): string {
  const profile = getEnvironmentProfile(mode)

  if (profile.storageType !== 'file') {
    throw new EnvironmentConfigurationError(mode, 'does not use file storage')
  }

  if (!profile.storageDir) {
    throw new EnvironmentConfigurationError(mode, 'does not have a storage directory configured')
  }

  return profile.storageDir
}

/**
 * Check if debug features should be enabled
 */
export function shouldEnableDebug(mode: EnvironmentMode): boolean {
  return getEnvironmentProfile(mode).enableDebug
}

/**
 * Check if caching should be enabled
 */
export function shouldEnableCache(mode: EnvironmentMode): boolean {
  return getEnvironmentProfile(mode).cacheEnabled
}

/**
 * Get log level for the environment
 */
export function getLogLevel(mode: EnvironmentMode): string {
  return getEnvironmentProfile(mode).logLevel
}
