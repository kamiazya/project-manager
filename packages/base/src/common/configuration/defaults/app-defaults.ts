/**
 * Default Application Configuration
 *
 * Provides default values for application-level configuration settings only.
 * This is separate from the nested configuration schemas.
 */

// AppConfigSchema import removed - not used in this file

/**
 * App-level configuration defaults (without nested schemas)
 */
export interface AppLevelConfigDefaults {
  readonly name: string
  readonly version: string
  readonly environment: 'development' | 'production' | 'test'
  readonly debug: boolean
  readonly enableDebugMode: boolean // Alias for debug
  readonly enableVerboseLogging: boolean
  readonly telemetryEnabled: boolean
  readonly enableTelemetry: boolean // Alias for telemetryEnabled
  readonly crashReportingEnabled: boolean
  readonly enableCrashReporting: boolean // Alias for crashReportingEnabled
  readonly autoUpdateEnabled: boolean
  readonly enableUpdateCheck: boolean // Alias for autoUpdateEnabled
  readonly updateCheckInterval: number
  readonly extensions: Record<string, unknown>
}

/**
 * Default app-level configuration values
 */
export const DEFAULT_APP_LEVEL_CONFIG: AppLevelConfigDefaults = {
  name: 'Project Manager',
  version: '0.0.0',
  environment: 'development',
  debug: false,
  enableDebugMode: false,
  enableVerboseLogging: false,
  telemetryEnabled: false,
  enableTelemetry: false,
  crashReportingEnabled: false,
  enableCrashReporting: false,
  autoUpdateEnabled: true,
  enableUpdateCheck: true,
  updateCheckInterval: 24, // 24 hours
  extensions: {},
} as const

/**
 * Environment-specific configuration overrides
 */
export const ENVIRONMENT_OVERRIDES: Record<string, Partial<AppLevelConfigDefaults>> = {
  development: {
    debug: true,
    enableDebugMode: true,
    enableVerboseLogging: true,
    telemetryEnabled: false,
    enableTelemetry: false,
    crashReportingEnabled: false,
    enableCrashReporting: false,
    autoUpdateEnabled: true,
    enableUpdateCheck: true,
    updateCheckInterval: 24,
  },

  production: {
    debug: false,
    enableDebugMode: false,
    enableVerboseLogging: false,
    telemetryEnabled: true,
    enableTelemetry: true,
    crashReportingEnabled: true,
    enableCrashReporting: true,
    autoUpdateEnabled: true,
    enableUpdateCheck: true,
    updateCheckInterval: 24,
  },

  test: {
    debug: false,
    enableDebugMode: false,
    enableVerboseLogging: false,
    telemetryEnabled: false,
    enableTelemetry: false,
    crashReportingEnabled: false,
    enableCrashReporting: false,
    autoUpdateEnabled: false,
    enableUpdateCheck: false,
    updateCheckInterval: 24,
  },
} as const

/**
 * Get default app-level configuration for a specific environment
 */
export function getDefaultAppLevelConfig(
  environment: string = 'development'
): AppLevelConfigDefaults {
  const envOverrides = ENVIRONMENT_OVERRIDES[environment] || {}
  return {
    ...DEFAULT_APP_LEVEL_CONFIG,
    ...envOverrides,
    environment: environment as AppLevelConfigDefaults['environment'],
  }
}

/**
 * Application configuration defaults helper
 */
export class AppConfigDefaults {
  /**
   * Get the default app-level configuration
   */
  static getDefaults(): AppLevelConfigDefaults {
    return { ...DEFAULT_APP_LEVEL_CONFIG }
  }

  /**
   * Get environment-specific defaults
   */
  static getEnvironmentDefaults(environment: string): AppLevelConfigDefaults {
    return getDefaultAppLevelConfig(environment)
  }

  /**
   * Merge user configuration with defaults
   */
  static mergeWithDefaults(userConfig: Partial<AppLevelConfigDefaults>): AppLevelConfigDefaults {
    const environment = userConfig.environment || 'development'
    const defaults = getDefaultAppLevelConfig(environment)

    return {
      ...defaults,
      ...userConfig,
      extensions: {
        ...defaults.extensions,
        ...userConfig.extensions,
      },
    }
  }

  /**
   * Get feature flag defaults
   */
  static getFeatureFlagDefaults(): Pick<
    AppLevelConfigDefaults,
    'debug' | 'enableDebugMode' | 'telemetryEnabled' | 'crashReportingEnabled' | 'autoUpdateEnabled'
  > {
    return {
      debug: DEFAULT_APP_LEVEL_CONFIG.debug,
      enableDebugMode: DEFAULT_APP_LEVEL_CONFIG.enableDebugMode,
      telemetryEnabled: DEFAULT_APP_LEVEL_CONFIG.telemetryEnabled,
      crashReportingEnabled: DEFAULT_APP_LEVEL_CONFIG.crashReportingEnabled,
      autoUpdateEnabled: DEFAULT_APP_LEVEL_CONFIG.autoUpdateEnabled,
    }
  }
}
