/**
 * XDG Base Directory compliant implementation of StorageConfigService.
 * This implementation follows the XDG Base Directory Specification for cross-platform
 * configuration file storage.
 */

import { homedir } from 'node:os'
import { join } from 'node:path'
import type { StorageConfigService } from '@project-manager/application'

// Storage configuration constants
const STORAGE_CONFIG = {
  CONFIG_DIR_NAME: 'project-manager',
  DEFAULT_TICKETS_FILE: 'tickets.json',
} as const

// Environment variables
const ENV_VARS = {
  STORAGE_PATH: 'PM_STORAGE_PATH',
  XDG_CONFIG_HOME: 'XDG_CONFIG_HOME',
  XDG_DATA_HOME: 'XDG_DATA_HOME',
} as const

/**
 * XDG Base Directory compliant implementation of StorageConfigService.
 * Resolves storage paths according to XDG Base Directory specification.
 */
export class XdgStorageConfigService implements StorageConfigService {
  /**
   * Repository identifier for caching - minification-safe and stable across instances
   */
  readonly serviceId = 'XdgStorageConfigService'

  /**
   * Get the default storage directory path following XDG Base Directory specification
   * @param mode Optional SDK mode to override auto-detection
   */
  getDefaultStorageDir(mode?: string): string {
    const homeDir = homedir()
    const configHome = process.env[ENV_VARS.XDG_CONFIG_HOME] || join(homeDir, '.config')

    // Use SDK mode system for directory naming
    let dirName: string
    if (mode) {
      // If mode is provided, use it directly for directory naming
      dirName =
        mode === 'development'
          ? `${STORAGE_CONFIG.CONFIG_DIR_NAME}-dev`
          : mode === 'production'
            ? STORAGE_CONFIG.CONFIG_DIR_NAME
            : `${STORAGE_CONFIG.CONFIG_DIR_NAME}-${mode}`
    } else {
      // Fallback to environment variable for backward compatibility
      const isDevelopment = process.env.NODE_ENV === 'development'
      dirName = isDevelopment
        ? `${STORAGE_CONFIG.CONFIG_DIR_NAME}-dev`
        : STORAGE_CONFIG.CONFIG_DIR_NAME
    }

    return join(configHome, dirName)
  }

  /**
   * Get the default storage file path
   */
  getDefaultStoragePath(): string {
    return join(this.getDefaultStorageDir(), STORAGE_CONFIG.DEFAULT_TICKETS_FILE)
  }

  /**
   * Get storage path from environment variable or default
   */
  resolveStoragePath(customPath?: string): string {
    // Priority: custom path > environment variable > default
    if (customPath?.trim()) {
      return customPath.trim()
    }

    const envPath = process.env[ENV_VARS.STORAGE_PATH]?.trim()
    if (envPath && envPath.length > 0) {
      return envPath
    }

    return this.getDefaultStoragePath()
  }

  /**
   * Get the logs directory path following XDG Base Directory specification
   * @param mode Optional SDK mode to override auto-detection
   */
  getLogsPath(mode?: string): string {
    const homeDir = homedir()
    const dataHome = process.env[ENV_VARS.XDG_DATA_HOME] || join(homeDir, '.local', 'share')

    // Use SDK mode system for directory naming
    let dirName: string
    if (mode) {
      // If mode is provided, use it directly for directory naming
      dirName =
        mode === 'development'
          ? `${STORAGE_CONFIG.CONFIG_DIR_NAME}-dev`
          : mode === 'production'
            ? STORAGE_CONFIG.CONFIG_DIR_NAME
            : `${STORAGE_CONFIG.CONFIG_DIR_NAME}-${mode}`
    } else {
      // Fallback to environment variable for backward compatibility
      const isDevelopment = process.env.NODE_ENV === 'development'
      dirName = isDevelopment
        ? `${STORAGE_CONFIG.CONFIG_DIR_NAME}-dev`
        : STORAGE_CONFIG.CONFIG_DIR_NAME
    }

    return join(dataHome, dirName, 'logs')
  }

  /**
   * Get full path for application log file.
   * @param filename Optional filename (defaults to 'app.log')
   */
  getApplicationLogPath(filename: string = 'app.log'): string {
    return join(this.getLogsPath(), filename)
  }

  /**
   * Get full path for audit log file.
   * @param filename Optional filename (defaults to 'audit.log')
   */
  getAuditLogPath(filename: string = 'audit.log'): string {
    return join(this.getLogsPath(), filename)
  }
}
