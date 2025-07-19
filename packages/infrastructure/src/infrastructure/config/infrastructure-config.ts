/**
 * Infrastructure layer configuration constants
 * These constants are specific to infrastructure concerns like file system operations
 */

import { homedir } from 'node:os'
import { join } from 'node:path'

// File system related constants
export const FILE_SYSTEM = {
  CONFIG_DIR_NAME: 'project-manager',
  DEFAULT_TICKETS_FILE: 'tickets.json',
  FILE_ENCODING: 'utf-8' as const,
  JSON_INDENT: 2,
} as const

// Environment variables
export const ENV_VARS = {
  STORAGE_PATH: 'PM_STORAGE_PATH',
  XDG_CONFIG_HOME: 'XDG_CONFIG_HOME',
  HOME: 'HOME',
} as const

/**
 * Get the default storage directory path following XDG Base Directory specification
 */
export function getDefaultStorageDir(): string {
  const homeDir = homedir()
  const configHome = process.env[ENV_VARS.XDG_CONFIG_HOME] || join(homeDir, '.config')

  // Use separate directory for development environment
  const isDevelopment = process.env.NODE_ENV === 'development'
  const dirName = isDevelopment ? `${FILE_SYSTEM.CONFIG_DIR_NAME}-dev` : FILE_SYSTEM.CONFIG_DIR_NAME

  return join(configHome, dirName)
}

/**
 * Get the default storage file path
 */
export function getDefaultStoragePath(): string {
  return join(getDefaultStorageDir(), FILE_SYSTEM.DEFAULT_TICKETS_FILE)
}

/**
 * Get storage path from environment variable or default
 */
export function getStoragePath(): string {
  const envPath = process.env[ENV_VARS.STORAGE_PATH]?.trim()
  return envPath && envPath.length > 0 ? envPath : getDefaultStoragePath()
}
