/**
 * Default Storage Configuration
 *
 * Provides default values for storage-related configuration settings.
 * These defaults represent sensible choices for most file system scenarios.
 */

import type { StorageConfigSchema } from '../../../kernel/configuration/schemas/storage-config.ts'

/**
 * Default storage configuration values
 */
export const DEFAULT_STORAGE_CONFIG: StorageConfigSchema = {
  // Path Configuration
  dataPath: '', // Empty means use XDG default

  // Backup Configuration
  backupEnabled: true,
  backupCount: 5,

  // Standards Compliance
  xdgCompliant: true,

  // File Configuration
  fileEncoding: 'utf8',

  // Performance Settings
  compressionEnabled: false,
  compressionThreshold: 10240, // 10KB

  // Reliability Settings
  fileLockingEnabled: true,
  fileOperationTimeout: 30000, // 30 seconds

  // Cleanup Settings
  autoCleanupEnabled: true,
  cleanupThresholdDays: 30,

  // Integrity Settings
  integrityChecksEnabled: true,
  syncToDisk: false, // fsync after writes
} as const

/**
 * Environment-specific configuration overrides
 */
export const STORAGE_ENVIRONMENT_OVERRIDES: Record<string, Partial<StorageConfigSchema>> = {
  development: {
    backupEnabled: false,
    backupCount: 2,
    compressionEnabled: false,
    autoCleanupEnabled: false,
    syncToDisk: false,
    fileOperationTimeout: 10000, // 10 seconds
  },

  production: {
    backupEnabled: true,
    backupCount: 10,
    compressionEnabled: true,
    compressionThreshold: 5120, // 5KB
    autoCleanupEnabled: true,
    cleanupThresholdDays: 90,
    syncToDisk: true,
    fileOperationTimeout: 60000, // 60 seconds
  },

  test: {
    backupEnabled: false,
    backupCount: 1,
    compressionEnabled: false,
    autoCleanupEnabled: false,
    integrityChecksEnabled: false,
    syncToDisk: false,
    fileOperationTimeout: 5000, // 5 seconds
  },
} as const

/**
 * Platform-specific configuration overrides
 */
export const PLATFORM_OVERRIDES: Record<string, Partial<StorageConfigSchema>> = {
  win32: {
    xdgCompliant: false, // Use Windows-specific paths
    fileEncoding: 'utf8',
    fileLockingEnabled: true,
  },

  darwin: {
    xdgCompliant: true,
    fileEncoding: 'utf8',
    fileLockingEnabled: true,
  },

  linux: {
    xdgCompliant: true,
    fileEncoding: 'utf8',
    fileLockingEnabled: true,
  },

  // Default for unknown platforms
  default: {
    xdgCompliant: true,
    fileEncoding: 'utf8',
    fileLockingEnabled: true,
  },
} as const

/**
 * Performance profile-specific configuration overrides
 */
export const PERFORMANCE_OVERRIDES: Record<string, Partial<StorageConfigSchema>> = {
  fast: {
    compressionEnabled: false,
    integrityChecksEnabled: false,
    syncToDisk: false,
    fileOperationTimeout: 5000,
  },

  balanced: {
    compressionEnabled: true,
    compressionThreshold: 10240,
    integrityChecksEnabled: true,
    syncToDisk: false,
    fileOperationTimeout: 30000,
  },

  safe: {
    compressionEnabled: true,
    compressionThreshold: 5120,
    integrityChecksEnabled: true,
    syncToDisk: true,
    fileOperationTimeout: 60000,
    backupEnabled: true,
    backupCount: 10,
  },
} as const

/**
 * Get default configuration for specific environment, platform, and performance profile
 */
export function getDefaultStorageConfig(
  environment: string = 'development',
  platform: string = process.platform,
  performanceProfile: string = 'balanced'
): StorageConfigSchema {
  const envOverrides = STORAGE_ENVIRONMENT_OVERRIDES[environment] || {}
  const platformOverrides = PLATFORM_OVERRIDES[platform] || PLATFORM_OVERRIDES.default
  const perfOverrides = PERFORMANCE_OVERRIDES[performanceProfile] || {}

  return {
    ...DEFAULT_STORAGE_CONFIG,
    ...envOverrides,
    ...platformOverrides,
    ...perfOverrides,
  }
}

/**
 * Storage configuration validation helpers
 */
export class StorageConfigDefaults {
  /**
   * Get the default configuration
   */
  static getDefaults(): StorageConfigSchema {
    return { ...DEFAULT_STORAGE_CONFIG }
  }

  /**
   * Get environment-specific defaults
   */
  static getEnvironmentDefaults(environment: string): StorageConfigSchema {
    const envOverrides = STORAGE_ENVIRONMENT_OVERRIDES[environment] || {}
    return {
      ...DEFAULT_STORAGE_CONFIG,
      ...envOverrides,
    }
  }

  /**
   * Get platform-specific defaults
   */
  static getPlatformDefaults(platform: string): StorageConfigSchema {
    return getDefaultStorageConfig('development', platform, 'balanced')
  }

  /**
   * Get performance profile-specific defaults
   */
  static getPerformanceDefaults(performanceProfile: string): StorageConfigSchema {
    return getDefaultStorageConfig('development', process.platform, performanceProfile)
  }

  /**
   * Merge user configuration with defaults
   */
  static mergeWithDefaults(
    userConfig: Partial<StorageConfigSchema>,
    environment: string = 'development',
    platform: string = process.platform,
    performanceProfile: string = 'balanced'
  ): StorageConfigSchema {
    const defaults = getDefaultStorageConfig(environment, platform, performanceProfile)

    return {
      ...defaults,
      ...userConfig,
    }
  }

  /**
   * Get backup defaults
   */
  static getBackupDefaults(): Pick<StorageConfigSchema, 'backupEnabled' | 'backupCount'> {
    return {
      backupEnabled: DEFAULT_STORAGE_CONFIG.backupEnabled,
      backupCount: DEFAULT_STORAGE_CONFIG.backupCount,
    }
  }

  /**
   * Get performance settings defaults
   */
  static getPerformanceSettingsDefaults(): Pick<
    StorageConfigSchema,
    'compressionEnabled' | 'compressionThreshold' | 'fileOperationTimeout'
  > {
    return {
      compressionEnabled: DEFAULT_STORAGE_CONFIG.compressionEnabled,
      compressionThreshold: DEFAULT_STORAGE_CONFIG.compressionThreshold,
      fileOperationTimeout: DEFAULT_STORAGE_CONFIG.fileOperationTimeout,
    }
  }

  /**
   * Get reliability defaults
   */
  static getReliabilityDefaults(): Pick<
    StorageConfigSchema,
    'fileLockingEnabled' | 'integrityChecksEnabled' | 'syncToDisk'
  > {
    return {
      fileLockingEnabled: DEFAULT_STORAGE_CONFIG.fileLockingEnabled,
      integrityChecksEnabled: DEFAULT_STORAGE_CONFIG.integrityChecksEnabled,
      syncToDisk: DEFAULT_STORAGE_CONFIG.syncToDisk,
    }
  }

  /**
   * Get cleanup defaults
   */
  static getCleanupDefaults(): Pick<
    StorageConfigSchema,
    'autoCleanupEnabled' | 'cleanupThresholdDays'
  > {
    return {
      autoCleanupEnabled: DEFAULT_STORAGE_CONFIG.autoCleanupEnabled,
      cleanupThresholdDays: DEFAULT_STORAGE_CONFIG.cleanupThresholdDays,
    }
  }

  /**
   * Get recommended configuration for specific use cases
   */
  static getRecommendedConfig(useCase: string): StorageConfigSchema {
    const configs: Record<string, StorageConfigSchema> = {
      development: getDefaultStorageConfig('development', process.platform, 'fast'),
      production: getDefaultStorageConfig('production', process.platform, 'safe'),
      testing: getDefaultStorageConfig('test', process.platform, 'fast'),
      ci: getDefaultStorageConfig('test', process.platform, 'fast'),
    }

    return configs[useCase] || configs.development!
  }
}
