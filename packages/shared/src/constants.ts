/**
 * Application-wide constants for the project manager system.
 * This centralizes all hardcoded values to improve maintainability.
 */

// Validation limits
export const VALIDATION = {
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 2000,
  TICKET_ID_MIN_LENGTH: 8, // Ticket IDs are exactly 8 hex characters
  TICKET_ID_MAX_LENGTH: 8, // Must match ID_GENERATION.VALIDATION_PATTERN
  TITLE_DISPLAY_MAX_LENGTH: 40,
  TITLE_TRUNCATE_LENGTH: 37,
} as const

// File system related
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

// Default values
export const DEFAULTS = {
  PRIORITY: 'medium' as const,
  TYPE: 'task' as const,
  PRIVACY: 'local-only' as const,
  STATUS: 'pending' as const,
  OUTPUT_FORMAT: 'table' as const,
} as const

// CLI configuration
export const CLI = {
  COMMAND_NAME: 'pm',
  DESCRIPTION: 'Local-first ticket management system for AI-assisted development',
} as const

// ID generation settings
export const ID_GENERATION = {
  RANDOM_BYTES: 4,
  VALIDATION_PATTERN: /^[a-f0-9]{8}$/,
} as const
