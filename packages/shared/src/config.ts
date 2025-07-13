/**
 * Configuration management for the project manager system.
 * Supports .pmrc.json files and environment variables.
 */

import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { DEFAULTS, ENV_VARS, FILE_SYSTEM } from './constants.ts'

// Configuration interface
export interface Config {
  // Default values for CLI operations
  defaultPriority: 'high' | 'medium' | 'low'
  defaultType: 'feature' | 'bug' | 'task'
  defaultPrivacy: 'local-only' | 'shareable' | 'public'
  defaultStatus: 'pending' | 'in_progress'
  defaultOutputFormat: 'table' | 'json' | 'compact'

  // Storage configuration
  storagePath?: string

  // CLI behavior
  confirmDeletion: boolean
  showHelpOnError: boolean

  // Display preferences
  maxTitleLength: number
  dateFormat: 'iso' | 'short' | 'relative'

  // Feature flags
  enableInteractiveMode: boolean
  enableColorOutput: boolean
}

// Default configuration
export const DEFAULT_CONFIG: Config = {
  defaultPriority: DEFAULTS.PRIORITY,
  defaultType: DEFAULTS.TYPE,
  defaultPrivacy: DEFAULTS.PRIVACY,
  defaultStatus: DEFAULTS.STATUS,
  defaultOutputFormat: DEFAULTS.OUTPUT_FORMAT,
  confirmDeletion: true,
  showHelpOnError: true,
  maxTitleLength: 50,
  dateFormat: 'relative',
  enableInteractiveMode: true,
  enableColorOutput: true,
}

// Environment variable mappings
const ENV_MAPPINGS = {
  [ENV_VARS.STORAGE_PATH]: 'storagePath',
  PM_DEFAULT_PRIORITY: 'defaultPriority',
  PM_DEFAULT_TYPE: 'defaultType',
  PM_DEFAULT_PRIVACY: 'defaultPrivacy',
  PM_DEFAULT_STATUS: 'defaultStatus',
  PM_DEFAULT_OUTPUT_FORMAT: 'defaultOutputFormat',
  PM_CONFIRM_DELETION: 'confirmDeletion',
  PM_SHOW_HELP_ON_ERROR: 'showHelpOnError',
  PM_MAX_TITLE_LENGTH: 'maxTitleLength',
  PM_DATE_FORMAT: 'dateFormat',
  PM_ENABLE_INTERACTIVE_MODE: 'enableInteractiveMode',
  PM_ENABLE_COLOR_OUTPUT: 'enableColorOutput',
} as const

/**
 * Get configuration file paths in order of precedence
 */
function getConfigPaths(): string[] {
  const paths: string[] = []

  // Use separate directory for development environment
  const isDevelopment = process.env.NODE_ENV === 'development'
  const dirName = isDevelopment ? `${FILE_SYSTEM.CONFIG_DIR_NAME}-dev` : FILE_SYSTEM.CONFIG_DIR_NAME

  // 1. Current directory
  paths.push(join(process.cwd(), '.pmrc.json'))

  // 2. Home directory
  paths.push(join(homedir(), '.pmrc.json'))

  // 3. XDG config directory
  const xdgConfigHome = process.env[ENV_VARS.XDG_CONFIG_HOME]
  if (xdgConfigHome) {
    paths.push(join(xdgConfigHome, dirName, 'config.json'))
  }

  // 4. Default config directory
  paths.push(join(homedir(), '.config', dirName, 'config.json'))

  return paths
}

/**
 * Load configuration from file
 */
function loadConfigFromFile(filePath: string): Partial<Config> {
  try {
    if (!existsSync(filePath)) {
      return {}
    }

    const content = readFileSync(filePath, FILE_SYSTEM.FILE_ENCODING)
    const parsed = JSON.parse(content)

    // Validate that it's an object
    if (typeof parsed !== 'object' || parsed === null) {
      return {}
    }

    return parsed
  } catch (_error) {
    // Silently ignore file reading errors
    return {}
  }
}

/**
 * Load configuration from environment variables
 */
function loadConfigFromEnv(): Partial<Config> {
  const config: Partial<Config> = {}

  for (const [envKey, configKey] of Object.entries(ENV_MAPPINGS)) {
    const value = process.env[envKey]
    if (value !== undefined) {
      // Type conversion based on the expected type
      if (
        configKey === 'confirmDeletion' ||
        configKey === 'showHelpOnError' ||
        configKey === 'enableInteractiveMode' ||
        configKey === 'enableColorOutput'
      ) {
        ;(config as any)[configKey] = value.toLowerCase() === 'true'
      } else if (configKey === 'maxTitleLength') {
        const parsed = parseInt(value, 10)
        if (!Number.isNaN(parsed) && parsed > 0) {
          ;(config as any)[configKey] = parsed
        }
      } else {
        ;(config as any)[configKey] = value
      }
    }
  }

  return config
}

/**
 * Load and merge configuration from all sources
 */
export function loadConfig(): Config {
  const config = { ...DEFAULT_CONFIG }

  // Load from configuration files (in order of precedence)
  const configPaths = getConfigPaths()
  for (const path of configPaths.reverse()) {
    // Reverse to apply in correct order
    const fileConfig = loadConfigFromFile(path)
    Object.assign(config, fileConfig)
  }

  // Load from environment variables (highest precedence)
  const envConfig = loadConfigFromEnv()
  Object.assign(config, envConfig)

  return config
}

/**
 * Get the current configuration
 */
let cachedConfig: Config | null = null

export function getConfig(): Config {
  if (!cachedConfig) {
    cachedConfig = loadConfig()
  }
  return cachedConfig
}

/**
 * Reset cached configuration (useful for testing)
 */
export function resetConfig(): void {
  cachedConfig = null
}

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

/**
 * Validate configuration values
 */
export function validateConfig(config: Partial<Config>): string[] {
  const errors: string[] = []

  // Validate priority
  if (config.defaultPriority && !['high', 'medium', 'low'].includes(config.defaultPriority)) {
    errors.push(`Invalid defaultPriority: ${config.defaultPriority}`)
  }

  // Validate type
  if (config.defaultType && !['feature', 'bug', 'task'].includes(config.defaultType)) {
    errors.push(`Invalid defaultType: ${config.defaultType}`)
  }

  // Validate privacy
  if (
    config.defaultPrivacy &&
    !['local-only', 'shareable', 'public'].includes(config.defaultPrivacy)
  ) {
    errors.push(`Invalid defaultPrivacy: ${config.defaultPrivacy}`)
  }

  // Validate status
  if (config.defaultStatus && !['pending', 'in_progress'].includes(config.defaultStatus)) {
    errors.push(`Invalid defaultStatus: ${config.defaultStatus}`)
  }

  // Validate output format
  if (
    config.defaultOutputFormat &&
    !['table', 'json', 'compact'].includes(config.defaultOutputFormat)
  ) {
    errors.push(`Invalid defaultOutputFormat: ${config.defaultOutputFormat}`)
  }

  // Validate date format
  if (config.dateFormat && !['iso', 'short', 'relative'].includes(config.dateFormat)) {
    errors.push(`Invalid dateFormat: ${config.dateFormat}`)
  }

  // Validate numeric values
  if (
    config.maxTitleLength !== undefined &&
    (config.maxTitleLength < 1 || config.maxTitleLength > 200)
  ) {
    errors.push(`Invalid maxTitleLength: ${config.maxTitleLength} (must be between 1 and 200)`)
  }

  return errors
}
