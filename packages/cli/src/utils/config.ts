import { existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

// CLI-specific configuration constants
const CONFIG_DIR_NAME = 'project-manager'
const DEFAULT_TICKETS_FILE = 'tickets.json'
const ENV_VARS = {
  STORAGE_PATH: 'PM_STORAGE_PATH',
  XDG_CONFIG_HOME: 'XDG_CONFIG_HOME',
} as const

/**
 * Get the default storage directory path following XDG Base Directory specification
 */
function getDefaultStorageDir(): string {
  const homeDir = homedir()
  const configHome = process.env[ENV_VARS.XDG_CONFIG_HOME] || join(homeDir, '.config')

  // Use separate directory for development environment
  const isDevelopment = process.env.NODE_ENV === 'development'
  const dirName = isDevelopment ? `${CONFIG_DIR_NAME}-dev` : CONFIG_DIR_NAME

  return join(configHome, dirName)
}

/**
 * Get the default storage file path
 */
function getDefaultStorageFilePath(): string {
  return join(getDefaultStorageDir(), DEFAULT_TICKETS_FILE)
}

/**
 * Get storage path and ensure the directory exists
 */
export function getStoragePath(): string {
  // Get storage path from environment variable or default
  const envPath = process.env[ENV_VARS.STORAGE_PATH]?.trim()
  const storagePath = envPath && envPath.length > 0 ? envPath : getDefaultStorageFilePath()

  // Ensure directory exists
  const storageDir = dirname(storagePath)
  if (!existsSync(storageDir)) {
    mkdirSync(storageDir, { recursive: true })
  }

  return storagePath
}

/**
 * @deprecated Use getStoragePath() instead
 */
export function getDefaultStoragePath(): string {
  return getStoragePath()
}
