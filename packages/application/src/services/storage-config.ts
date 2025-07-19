/**
 * Storage configuration service for the application layer.
 * Resolves storage paths according to XDG Base Directory specification.
 */

import { homedir } from 'node:os'
import { join } from 'node:path'

// Storage configuration constants
const STORAGE_CONFIG = {
  CONFIG_DIR_NAME: 'project-manager',
  DEFAULT_TICKETS_FILE: 'tickets.json',
} as const

// Environment variables
const ENV_VARS = {
  STORAGE_PATH: 'PM_STORAGE_PATH',
  XDG_CONFIG_HOME: 'XDG_CONFIG_HOME',
} as const

/**
 * Storage configuration service that provides storage path resolution
 * for the application layer.
 */
export class StorageConfigService {
  /**
   * Get the default storage directory path following XDG Base Directory specification
   */
  static getDefaultStorageDir(): string {
    const homeDir = homedir()
    const configHome = process.env[ENV_VARS.XDG_CONFIG_HOME] || join(homeDir, '.config')

    // Use separate directory for development environment
    const isDevelopment = process.env.NODE_ENV === 'development'
    const dirName = isDevelopment
      ? `${STORAGE_CONFIG.CONFIG_DIR_NAME}-dev`
      : STORAGE_CONFIG.CONFIG_DIR_NAME

    return join(configHome, dirName)
  }

  /**
   * Get the default storage file path
   */
  static getDefaultStoragePath(): string {
    return join(StorageConfigService.getDefaultStorageDir(), STORAGE_CONFIG.DEFAULT_TICKETS_FILE)
  }

  /**
   * Get storage path from environment variable or default
   */
  static resolveStoragePath(customPath?: string): string {
    // Priority: custom path > environment variable > default
    if (customPath?.trim()) {
      return customPath.trim()
    }

    const envPath = process.env[ENV_VARS.STORAGE_PATH]?.trim()
    if (envPath && envPath.length > 0) {
      return envPath
    }

    return StorageConfigService.getDefaultStoragePath()
  }
}
