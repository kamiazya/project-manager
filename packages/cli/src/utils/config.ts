import { existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { ENV_VARS, FILE_SYSTEM } from '@project-manager/shared'

/**
 * Get the default storage file path following XDG Base Directory specification
 */
export function getDefaultStoragePath(): string {
  const homeDir = homedir()
  const configHome = process.env[ENV_VARS.XDG_CONFIG_HOME] || join(homeDir, '.config')
  const projectManagerDir = join(configHome, FILE_SYSTEM.CONFIG_DIR_NAME)

  // Ensure directory exists
  if (!existsSync(projectManagerDir)) {
    mkdirSync(projectManagerDir, { recursive: true })
  }

  return join(projectManagerDir, FILE_SYSTEM.DEFAULT_TICKETS_FILE)
}

/**
 * Get storage path from environment variable or default
 */
export function getStoragePath(): string {
  const envPath = process.env[ENV_VARS.STORAGE_PATH]?.trim()
  return envPath && envPath.length > 0 ? envPath : getDefaultStoragePath()
}
