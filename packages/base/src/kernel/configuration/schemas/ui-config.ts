/**
 * UI Configuration Schema
 *
 * Defines the structure and validation for user interface-related
 * configuration settings. This is part of the Shared Kernel since
 * UI preferences affect multiple bounded contexts.
 */

/**
 * Available output formats for command results
 */
export type OutputFormat = 'table' | 'json' | 'yaml' | 'plain'

/**
 * Date display formats
 */
export type DateFormat = 'absolute' | 'relative' | 'iso'

/**
 * Configuration schema for user interface preferences
 */
export interface UIConfigSchema {
  /**
   * Default output format for command results
   */
  readonly outputFormat: OutputFormat

  /**
   * Enable colored output in terminal
   */
  readonly enableColorOutput: boolean

  /**
   * Enable interactive prompts and confirmations
   */
  readonly enableInteractiveMode: boolean

  /**
   * Show help text when commands fail
   */
  readonly showHelpOnError: boolean

  /**
   * Maximum length for displayed ticket titles
   */
  readonly maxTitleLength: number

  /**
   * Date format for displaying timestamps
   */
  readonly dateFormat: DateFormat

  /**
   * Enable progress bars for long operations
   */
  readonly showProgressBars: boolean

  /**
   * Number of items to display per page in lists
   */
  readonly itemsPerPage: number

  /**
   * Enable sound notifications
   */
  readonly enableSoundNotifications: boolean

  /**
   * Enable desktop notifications
   */
  readonly enableDesktopNotifications: boolean

  /**
   * Theme for colored output
   */
  readonly theme: 'default' | 'dark' | 'light' | 'high-contrast'

  /**
   * Language for UI text
   */
  readonly language: 'en' | 'ja' | 'auto'
}

/**
 * Validation functions for UI configuration
 */
export const UIConfigValidation = {
  /**
   * Validate output format value
   */
  isValidOutputFormat: (value: string): value is OutputFormat => {
    return ['table', 'json', 'yaml', 'plain'].includes(value)
  },

  /**
   * Validate date format value
   */
  isValidDateFormat: (value: string): value is DateFormat => {
    return ['absolute', 'relative', 'iso'].includes(value)
  },

  /**
   * Validate theme value
   */
  isValidTheme: (value: string): value is UIConfigSchema['theme'] => {
    return ['default', 'dark', 'light', 'high-contrast'].includes(value)
  },

  /**
   * Validate language value
   */
  isValidLanguage: (value: string): value is UIConfigSchema['language'] => {
    return ['en', 'ja', 'auto'].includes(value)
  },

  /**
   * Validate entire UI configuration
   */
  isValidConfig: (config: unknown): config is UIConfigSchema => {
    if (!config || typeof config !== 'object') return false

    const c = config as Record<string, unknown>

    return (
      typeof c.outputFormat === 'string' &&
      UIConfigValidation.isValidOutputFormat(c.outputFormat) &&
      typeof c.enableColorOutput === 'boolean' &&
      typeof c.enableInteractiveMode === 'boolean' &&
      typeof c.showHelpOnError === 'boolean' &&
      typeof c.maxTitleLength === 'number' &&
      c.maxTitleLength > 0 &&
      typeof c.dateFormat === 'string' &&
      UIConfigValidation.isValidDateFormat(c.dateFormat) &&
      typeof c.showProgressBars === 'boolean' &&
      typeof c.itemsPerPage === 'number' &&
      c.itemsPerPage > 0 &&
      typeof c.enableSoundNotifications === 'boolean' &&
      typeof c.enableDesktopNotifications === 'boolean' &&
      typeof c.theme === 'string' &&
      UIConfigValidation.isValidTheme(c.theme) &&
      typeof c.language === 'string' &&
      UIConfigValidation.isValidLanguage(c.language)
    )
  },
}
