/**
 * Log level type system providing hierarchical severity levels.
 *
 * The logging system uses a hierarchical level system where each level
 * includes all higher-severity levels. For example, if configured for 'warn',
 * both 'warn', 'error', and 'fatal' messages will be logged.
 */

/**
 * Log level enumeration in order of severity (lowest to highest).
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

/**
 * Numeric representation of log levels for efficient comparison.
 * Lower numbers represent more verbose levels.
 */
export const LogLevelValues = {
  debug: 0, // Most verbose - detailed debugging information
  info: 1, // General information about application flow
  warn: 2, // Warning conditions that should be addressed
  error: 3, // Error conditions that require attention
  fatal: 4, // Critical failures that may cause application termination
} as const

/**
 * Type for log level numeric values.
 */
export type LogLevelValue = (typeof LogLevelValues)[LogLevel]

/**
 * Log level configuration interface for granular control.
 */
export interface LogLevelConfig {
  /** The minimum log level to output */
  level: LogLevel

  /** Whether this log level is enabled */
  enabled: boolean

  /** Custom label for this log level (optional) */
  label?: string

  /** Custom color for console output (optional) */
  color?: LogLevelColor
}

/**
 * Color options for console log level display.
 */
export type LogLevelColor =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'gray'
  | 'grey'

/**
 * Default color mapping for log levels.
 */
export const DefaultLogLevelColors: Record<LogLevel, LogLevelColor> = {
  debug: 'gray',
  info: 'green',
  warn: 'yellow',
  error: 'red',
  fatal: 'magenta',
} as const

/**
 * Log level utility functions.
 */
export const LogLevelUtils = {
  /**
   * Check if a given log level should be output based on configured minimum level.
   *
   * @param currentLevel - The level of the log message
   * @param configuredLevel - The minimum level configured for output
   * @returns true if the message should be logged
   */
  shouldLog(currentLevel: LogLevel, configuredLevel: LogLevel): boolean {
    return LogLevelValues[currentLevel] >= LogLevelValues[configuredLevel]
  },

  /**
   * Get all log levels that would be output for a given configuration level.
   *
   * @param configuredLevel - The minimum level configured
   * @returns Array of levels that would be output
   */
  getActiveLogLevels(configuredLevel: LogLevel): LogLevel[] {
    const configuredValue = LogLevelValues[configuredLevel]
    return Object.entries(LogLevelValues)
      .filter(([, value]) => value >= configuredValue)
      .map(([level]) => level as LogLevel)
      .sort((a, b) => LogLevelValues[a] - LogLevelValues[b])
  },

  /**
   * Convert log level to uppercase string for display.
   *
   * @param level - Log level to format
   * @returns Uppercase level string
   */
  formatLevel(level: LogLevel): string {
    return level.toUpperCase()
  },

  /**
   * Parse log level from string with fallback.
   *
   * @param levelString - String representation of log level
   * @param fallback - Fallback level if parsing fails
   * @returns Parsed log level or fallback
   */
  parseLogLevel(levelString: string, fallback: LogLevel = 'info'): LogLevel {
    const normalized = levelString.toLowerCase().trim()

    if (['debug', 'info', 'warn', 'error', 'fatal'].includes(normalized)) {
      return normalized as LogLevel
    }

    return fallback
  },

  /**
   * Get the numeric value for a log level.
   *
   * @param level - Log level
   * @returns Numeric representation
   */
  getLevelValue(level: LogLevel): LogLevelValue {
    return LogLevelValues[level]
  },

  /**
   * Compare two log levels.
   *
   * @param a - First log level
   * @param b - Second log level
   * @returns Negative if a < b, positive if a > b, zero if equal
   */
  compareLogLevels(a: LogLevel, b: LogLevel): number {
    return LogLevelValues[a] - LogLevelValues[b]
  },

  /**
   * Get the default color for a log level.
   *
   * @param level - Log level
   * @returns Default color for the level
   */
  getDefaultColor(level: LogLevel): LogLevelColor {
    return DefaultLogLevelColors[level]
  },

  /**
   * Check if a log level is valid.
   *
   * @param level - Level to validate
   * @returns true if valid log level
   */
  isValidLogLevel(level: string): level is LogLevel {
    return ['debug', 'info', 'warn', 'error', 'fatal'].includes(level)
  },
} as const

/**
 * Type guard to check if a value is a valid log level.
 *
 * @param value - Value to check
 * @returns true if value is a valid LogLevel
 */
export function isLogLevel(value: unknown): value is LogLevel {
  return typeof value === 'string' && LogLevelUtils.isValidLogLevel(value)
}
