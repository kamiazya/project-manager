/**
 * Default UI Configuration
 *
 * Provides default values for user interface configuration settings.
 * These defaults represent sensible choices for most user interaction scenarios.
 */

import type { UIConfigSchema } from '../../../kernel/configuration/schemas/ui-config.ts'

/**
 * Default UI configuration values
 */
export const DEFAULT_UI_CONFIG: UIConfigSchema = {
  // Output Configuration
  outputFormat: 'table',
  enableColorOutput: true,
  enableInteractiveMode: true,
  showHelpOnError: true,

  // Display Settings
  maxTitleLength: 60,
  dateFormat: 'relative',
  showProgressBars: true,
  itemsPerPage: 20,

  // Notification Settings
  enableSoundNotifications: false,
  enableDesktopNotifications: true,

  // Appearance
  theme: 'default',
  language: 'en',
} as const

/**
 * Terminal capability-specific configuration overrides
 */
export const TERMINAL_CAPABILITY_OVERRIDES: Record<string, Partial<UIConfigSchema>> = {
  // Basic terminal (no color, limited features)
  basic: {
    enableColorOutput: false,
    enableInteractiveMode: false,
    showProgressBars: false,
    outputFormat: 'plain',
  },

  // Standard terminal (color support, basic features)
  standard: {
    enableColorOutput: true,
    enableInteractiveMode: true,
    showProgressBars: true,
    outputFormat: 'table',
  },

  // Advanced terminal (full feature support)
  advanced: {
    enableColorOutput: true,
    enableInteractiveMode: true,
    showProgressBars: true,
    outputFormat: 'table',
    enableSoundNotifications: true,
    enableDesktopNotifications: true,
  },
} as const

/**
 * User role-specific configuration overrides
 */
export const USER_ROLE_OVERRIDES: Record<string, Partial<UIConfigSchema>> = {
  user: {
    outputFormat: 'table',
    enableColorOutput: true,
    maxTitleLength: 60,
    dateFormat: 'absolute',
    itemsPerPage: 20,
    showProgressBars: true,
  },

  developer: {
    outputFormat: 'json',
    enableColorOutput: true,
    maxTitleLength: 80,
    dateFormat: 'iso',
    itemsPerPage: 50,
  },

  manager: {
    outputFormat: 'table',
    enableColorOutput: true,
    maxTitleLength: 60,
    dateFormat: 'absolute',
    itemsPerPage: 20,
    showProgressBars: true,
  },

  designer: {
    outputFormat: 'table',
    enableColorOutput: true,
    maxTitleLength: 40,
    dateFormat: 'relative',
    itemsPerPage: 15,
    theme: 'default',
  },

  analyst: {
    outputFormat: 'json',
    enableColorOutput: false,
    maxTitleLength: 100,
    dateFormat: 'iso',
    itemsPerPage: 100,
  },
} as const

/**
 * Output format-specific configuration overrides
 */
export const OUTPUT_FORMAT_OVERRIDES: Record<string, Partial<UIConfigSchema>> = {
  table: {
    enableColorOutput: true,
    showProgressBars: true,
    maxTitleLength: 60,
  },

  json: {
    enableColorOutput: false,
    showProgressBars: false,
    enableInteractiveMode: false,
  },

  yaml: {
    enableColorOutput: false,
    showProgressBars: false,
    enableInteractiveMode: false,
  },

  plain: {
    enableColorOutput: false,
    showProgressBars: false,
    maxTitleLength: 80,
  },
} as const

/**
 * Get default configuration for specific terminal capabilities and user role
 */
export function getDefaultUIConfig(
  terminalCapability: string = 'standard',
  userRole: string = 'developer'
): UIConfigSchema {
  const terminalOverrides = TERMINAL_CAPABILITY_OVERRIDES[terminalCapability] || {}
  const roleOverrides = USER_ROLE_OVERRIDES[userRole] || {}

  return {
    ...DEFAULT_UI_CONFIG,
    ...terminalOverrides,
    ...roleOverrides,
  }
}

/**
 * UI configuration validation helpers
 */
export class UIConfigDefaults {
  /**
   * Get the default configuration
   */
  static getDefaults(): UIConfigSchema {
    return { ...DEFAULT_UI_CONFIG }
  }

  /**
   * Get terminal capability-specific defaults
   */
  static getTerminalCapabilityDefaults(capability: string): UIConfigSchema {
    const terminalOverrides = TERMINAL_CAPABILITY_OVERRIDES[capability] || {}
    return {
      ...DEFAULT_UI_CONFIG,
      ...terminalOverrides,
    }
  }

  /**
   * Get user role-specific defaults
   */
  static getUserRoleDefaults(userRole: string): UIConfigSchema {
    return getDefaultUIConfig('standard', userRole)
  }

  /**
   * Merge user configuration with defaults
   */
  static mergeWithDefaults(
    userConfig: Partial<UIConfigSchema>,
    terminalCapability: string = 'standard',
    userRole: string = 'developer'
  ): UIConfigSchema {
    const defaults = getDefaultUIConfig(terminalCapability, userRole)

    return {
      ...defaults,
      ...userConfig,
    }
  }

  /**
   * Get output format-specific defaults
   */
  static getOutputFormatDefaults(outputFormat: string): Partial<UIConfigSchema> {
    return OUTPUT_FORMAT_OVERRIDES[outputFormat] || {}
  }

  /**
   * Get display defaults
   */
  static getDisplayDefaults(): Pick<
    UIConfigSchema,
    'maxTitleLength' | 'dateFormat' | 'showProgressBars' | 'itemsPerPage'
  > {
    return {
      maxTitleLength: DEFAULT_UI_CONFIG.maxTitleLength,
      dateFormat: DEFAULT_UI_CONFIG.dateFormat,
      showProgressBars: DEFAULT_UI_CONFIG.showProgressBars,
      itemsPerPage: DEFAULT_UI_CONFIG.itemsPerPage,
    }
  }

  /**
   * Get notification defaults
   */
  static getNotificationDefaults(): Pick<
    UIConfigSchema,
    'enableSoundNotifications' | 'enableDesktopNotifications'
  > {
    return {
      enableSoundNotifications: DEFAULT_UI_CONFIG.enableSoundNotifications,
      enableDesktopNotifications: DEFAULT_UI_CONFIG.enableDesktopNotifications,
    }
  }

  /**
   * Detect terminal capabilities and return appropriate defaults
   */
  static getTerminalAwareDefaults(): UIConfigSchema {
    // In a real implementation, this would detect terminal capabilities
    // For now, we'll return standard defaults
    const hasColorSupport = process.stdout.isTTY && process.env.TERM !== 'dumb'
    const hasInteractiveSupport = process.stdout.isTTY

    const capability = hasColorSupport && hasInteractiveSupport ? 'standard' : 'basic'
    return getDefaultUIConfig(capability, 'developer')
  }
}
