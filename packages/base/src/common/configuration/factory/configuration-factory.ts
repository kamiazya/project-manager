/**
 * Configuration Factory
 *
 * Provides factory methods for creating complete configuration objects
 * with appropriate defaults based on context (environment, platform, etc.)
 */

import type { AppEnvironment } from '../../../kernel/configuration/schemas/app-config.ts'
import type { StorageConfigSchema } from '../../../kernel/configuration/schemas/storage-config.ts'
import type { TicketConfigSchema } from '../../../kernel/configuration/schemas/ticket-config.ts'
import type { UIConfigSchema } from '../../../kernel/configuration/schemas/ui-config.ts'
import { AppConfigDefaults, type AppLevelConfigDefaults } from '../defaults/app-defaults.ts'
import { StorageConfigDefaults } from '../defaults/storage-defaults.ts'
import { TicketConfigDefaults } from '../defaults/ticket-defaults.ts'
import { UIConfigDefaults } from '../defaults/ui-defaults.ts'

/**
 * Complete application configuration combining all configuration schemas
 */
export interface CompleteConfigurationSchema {
  app: AppLevelConfigDefaults
  ticket: TicketConfigSchema
  ui: UIConfigSchema
  storage: StorageConfigSchema
}

/**
 * Configuration creation context
 */
export interface ConfigurationContext {
  // Application context
  environment?: string
  platform?: string

  // Project context
  projectType?: string
  teamSize?: string

  // User context
  userRole?: string
  terminalCapability?: string
  performanceProfile?: string

  // Runtime context
  isInteractive?: boolean
  isCI?: boolean
  isDevelopment?: boolean
}

/**
 * Partial configuration input for factory methods
 */
export interface PartialConfigurationInput {
  // App-level configuration (flat)
  name?: string
  version?: string
  environment?: string
  debug?: boolean
  enableDebugMode?: boolean
  enableVerboseLogging?: boolean
  telemetryEnabled?: boolean
  enableTelemetry?: boolean
  crashReportingEnabled?: boolean
  enableCrashReporting?: boolean
  autoUpdateEnabled?: boolean
  enableUpdateCheck?: boolean
  updateCheckInterval?: number
  extensions?: Record<string, unknown>

  // App-level configuration (nested - for backward compatibility)
  app?: Partial<AppLevelConfigDefaults>

  // Nested configurations
  ticket?: Partial<TicketConfigSchema>
  ui?: Partial<UIConfigSchema>
  storage?: Partial<StorageConfigSchema>
}

/**
 * Configuration factory for creating complete configurations
 */
export class ConfigurationFactory {
  /**
   * Create a complete configuration with defaults
   */
  static createConfiguration(
    context: ConfigurationContext = {},
    userInput: PartialConfigurationInput = {}
  ): CompleteConfigurationSchema {
    const {
      environment = 'development',
      platform = process.platform,
      projectType = 'software',
      teamSize = 'solo',
      userRole = 'user', // Default to generic user, not developer
      terminalCapability = 'standard',
      performanceProfile = 'balanced',
    } = context

    // Create base app-level configuration with defaults
    const appDefaults = AppConfigDefaults.mergeWithDefaults({
      environment: environment as AppEnvironment,
    })

    // Handle CI environment override
    let actualTerminalCapability = terminalCapability
    let actualUserRole = userRole
    if (context.isCI) {
      actualTerminalCapability = 'basic'
      actualUserRole = 'user'
    }

    // Override nested configurations with context-specific defaults
    const ticketConfig = TicketConfigDefaults.mergeWithDefaults(
      userInput.ticket || {},
      projectType,
      teamSize
    )
    let uiConfig = UIConfigDefaults.mergeWithDefaults(
      userInput.ui || {},
      actualTerminalCapability,
      actualUserRole
    )

    // Apply CI-specific overrides for UI
    if (context.isCI) {
      uiConfig = {
        ...uiConfig,
        enableInteractiveMode: false,
        enableSoundNotifications: false,
        enableDesktopNotifications: false,
        outputFormat: 'plain',
        enableColorOutput: false,
      }
    }

    const storageConfig = StorageConfigDefaults.mergeWithDefaults(
      userInput.storage || {},
      environment,
      platform,
      performanceProfile
    )

    // Handle both flat and nested app configuration
    const appInput = userInput.app || {}
    const flatAppInput = {
      name: userInput.name || appInput.name,
      version: userInput.version || appInput.version,
      environment: userInput.environment || appInput.environment,
      debug: userInput.debug !== undefined ? userInput.debug : appInput.debug,
      enableDebugMode:
        userInput.enableDebugMode !== undefined
          ? userInput.enableDebugMode
          : appInput.enableDebugMode,
      enableVerboseLogging:
        userInput.enableVerboseLogging !== undefined
          ? userInput.enableVerboseLogging
          : appInput.enableVerboseLogging,
      telemetryEnabled:
        userInput.telemetryEnabled !== undefined
          ? userInput.telemetryEnabled
          : appInput.telemetryEnabled,
      enableTelemetry:
        userInput.enableTelemetry !== undefined
          ? userInput.enableTelemetry
          : appInput.enableTelemetry,
      crashReportingEnabled:
        userInput.crashReportingEnabled !== undefined
          ? userInput.crashReportingEnabled
          : appInput.crashReportingEnabled,
      enableCrashReporting:
        userInput.enableCrashReporting !== undefined
          ? userInput.enableCrashReporting
          : appInput.enableCrashReporting,
      autoUpdateEnabled:
        userInput.autoUpdateEnabled !== undefined
          ? userInput.autoUpdateEnabled
          : appInput.autoUpdateEnabled,
      enableUpdateCheck:
        userInput.enableUpdateCheck !== undefined
          ? userInput.enableUpdateCheck
          : appInput.enableUpdateCheck,
      updateCheckInterval: userInput.updateCheckInterval || appInput.updateCheckInterval,
      extensions: { ...userInput.extensions, ...appInput.extensions },
    }

    // Merge everything into final nested structure
    const finalConfig: CompleteConfigurationSchema = {
      app: {
        name: flatAppInput.name || appDefaults.name,
        version: flatAppInput.version || appDefaults.version,
        environment: (flatAppInput.environment ||
          appDefaults.environment) as AppLevelConfigDefaults['environment'],
        debug: flatAppInput.debug !== undefined ? flatAppInput.debug : appDefaults.debug,
        enableDebugMode:
          flatAppInput.enableDebugMode !== undefined
            ? flatAppInput.enableDebugMode
            : appDefaults.enableDebugMode,
        enableVerboseLogging:
          flatAppInput.enableVerboseLogging !== undefined
            ? flatAppInput.enableVerboseLogging
            : appDefaults.enableVerboseLogging,
        telemetryEnabled:
          flatAppInput.telemetryEnabled !== undefined
            ? flatAppInput.telemetryEnabled
            : appDefaults.telemetryEnabled,
        enableTelemetry:
          flatAppInput.enableTelemetry !== undefined
            ? flatAppInput.enableTelemetry
            : appDefaults.enableTelemetry,
        crashReportingEnabled:
          flatAppInput.crashReportingEnabled !== undefined
            ? flatAppInput.crashReportingEnabled
            : appDefaults.crashReportingEnabled,
        enableCrashReporting:
          flatAppInput.enableCrashReporting !== undefined
            ? flatAppInput.enableCrashReporting
            : appDefaults.enableCrashReporting,
        autoUpdateEnabled:
          flatAppInput.autoUpdateEnabled !== undefined
            ? flatAppInput.autoUpdateEnabled
            : appDefaults.autoUpdateEnabled,
        enableUpdateCheck:
          flatAppInput.enableUpdateCheck !== undefined
            ? flatAppInput.enableUpdateCheck
            : appDefaults.enableUpdateCheck,
        updateCheckInterval: flatAppInput.updateCheckInterval || appDefaults.updateCheckInterval,
        extensions: { ...appDefaults.extensions, ...flatAppInput.extensions },
      },
      ticket: ticketConfig,
      ui: uiConfig,
      storage: storageConfig,
    }

    return finalConfig
  }

  /**
   * Create development configuration
   */
  static createDevelopmentConfiguration(
    userInput: PartialConfigurationInput = {}
  ): CompleteConfigurationSchema {
    const context: ConfigurationContext = {
      environment: 'development',
      performanceProfile: 'fast',
      terminalCapability: 'advanced',
    }

    return ConfigurationFactory.createConfiguration(context, userInput)
  }

  /**
   * Create production configuration
   */
  static createProductionConfiguration(
    userInput: PartialConfigurationInput = {}
  ): CompleteConfigurationSchema {
    const context: ConfigurationContext = {
      environment: 'production',
      performanceProfile: 'safe',
      terminalCapability: 'standard',
    }

    return ConfigurationFactory.createConfiguration(context, userInput)
  }

  /**
   * Create test configuration
   */
  static createTestConfiguration(
    userInput: PartialConfigurationInput = {}
  ): CompleteConfigurationSchema {
    const context: ConfigurationContext = {
      environment: 'test',
      performanceProfile: 'fast',
      terminalCapability: 'basic',
      isInteractive: false,
    }

    return ConfigurationFactory.createConfiguration(context, userInput)
  }

  /**
   * Create CI configuration
   */
  static createCIConfiguration(
    userInput: PartialConfigurationInput = {}
  ): CompleteConfigurationSchema {
    const context: ConfigurationContext = {
      environment: 'test',
      performanceProfile: 'fast',
      terminalCapability: 'basic',
      isInteractive: false,
      isCI: true,
    }

    return ConfigurationFactory.createConfiguration(context, userInput)
  }

  /**
   * Create detected configuration based on environment
   */
  static createDetectedConfiguration(
    userInput: PartialConfigurationInput = {}
  ): CompleteConfigurationSchema {
    const context: ConfigurationContext = {
      environment: (process.env.NODE_ENV as string) || 'development',
      isCI: !!process.env.CI,
      isDevelopment: process.env.NODE_ENV === 'development',
      isInteractive: process.stdout.isTTY,
    }

    return ConfigurationFactory.createConfiguration(context, userInput)
  }

  /**
   * Get use case configurations
   */
  static getUseCase(useCase: string): CompleteConfigurationSchema {
    const useCases: Record<string, ConfigurationContext> = {
      'solo-developer': {
        environment: 'development',
        projectType: 'software',
        teamSize: 'solo',
        userRole: 'developer',
        terminalCapability: 'advanced',
        performanceProfile: 'fast',
      },
      'team-lead': {
        environment: 'development',
        projectType: 'software',
        teamSize: 'small',
        userRole: 'manager',
        terminalCapability: 'standard',
        performanceProfile: 'balanced',
      },
      'design-team': {
        environment: 'development',
        projectType: 'design',
        teamSize: 'small',
        userRole: 'designer',
        terminalCapability: 'standard',
        performanceProfile: 'balanced',
      },
    }

    const context = useCases[useCase]
    if (!context) {
      throw new Error(`Unknown use case: ${useCase}`)
    }

    return ConfigurationFactory.createConfiguration(context)
  }

  /**
   * Validate configuration consistency
   */
  static validateConfiguration(config: CompleteConfigurationSchema): string[] {
    const errors: string[] = []

    // Validate app configuration consistency
    if (config.app.environment === 'production' && config.app.debug) {
      errors.push('Debug mode should not be enabled in production')
    }

    // Validate ticket configuration consistency
    if (config.ticket.maxTitleLength < 10) {
      errors.push('Title length must be at least 10 characters')
    }

    // Validate UI configuration consistency
    if (config.ui.itemsPerPage < 1 || config.ui.itemsPerPage > 1000) {
      errors.push('Items per page must be between 1 and 1000')
    }

    // Validate storage configuration consistency
    if (config.storage.backupCount < 1 || config.storage.backupCount > 100) {
      errors.push('Backup count must be between 1 and 100')
    }

    return errors
  }
}

/**
 * Utility functions for configuration management
 */
export class ConfigurationUtils {
  /**
   * Deep merge two configuration objects
   */
  static mergeConfigurations(
    base: CompleteConfigurationSchema,
    override: PartialConfigurationInput
  ): CompleteConfigurationSchema {
    // Handle both flat and nested app configuration
    const appOverride = override.app || {}
    const mergedApp = {
      ...base.app,
      name: override.name || appOverride.name || base.app.name,
      version: override.version || appOverride.version || base.app.version,
      environment: (override.environment ||
        appOverride.environment ||
        base.app.environment) as AppLevelConfigDefaults['environment'],
      debug:
        override.debug !== undefined
          ? override.debug
          : appOverride.debug !== undefined
            ? appOverride.debug
            : base.app.debug,
      enableDebugMode:
        override.enableDebugMode !== undefined
          ? override.enableDebugMode
          : appOverride.enableDebugMode !== undefined
            ? appOverride.enableDebugMode
            : base.app.enableDebugMode,
      enableVerboseLogging:
        override.enableVerboseLogging !== undefined
          ? override.enableVerboseLogging
          : appOverride.enableVerboseLogging !== undefined
            ? appOverride.enableVerboseLogging
            : base.app.enableVerboseLogging,
      telemetryEnabled:
        override.telemetryEnabled !== undefined
          ? override.telemetryEnabled
          : appOverride.telemetryEnabled !== undefined
            ? appOverride.telemetryEnabled
            : base.app.telemetryEnabled,
      enableTelemetry:
        override.enableTelemetry !== undefined
          ? override.enableTelemetry
          : appOverride.enableTelemetry !== undefined
            ? appOverride.enableTelemetry
            : base.app.enableTelemetry,
      crashReportingEnabled:
        override.crashReportingEnabled !== undefined
          ? override.crashReportingEnabled
          : appOverride.crashReportingEnabled !== undefined
            ? appOverride.crashReportingEnabled
            : base.app.crashReportingEnabled,
      enableCrashReporting:
        override.enableCrashReporting !== undefined
          ? override.enableCrashReporting
          : appOverride.enableCrashReporting !== undefined
            ? appOverride.enableCrashReporting
            : base.app.enableCrashReporting,
      autoUpdateEnabled:
        override.autoUpdateEnabled !== undefined
          ? override.autoUpdateEnabled
          : appOverride.autoUpdateEnabled !== undefined
            ? appOverride.autoUpdateEnabled
            : base.app.autoUpdateEnabled,
      enableUpdateCheck:
        override.enableUpdateCheck !== undefined
          ? override.enableUpdateCheck
          : appOverride.enableUpdateCheck !== undefined
            ? appOverride.enableUpdateCheck
            : base.app.enableUpdateCheck,
      updateCheckInterval:
        override.updateCheckInterval ||
        appOverride.updateCheckInterval ||
        base.app.updateCheckInterval,
      extensions: { ...base.app.extensions, ...override.extensions, ...appOverride.extensions },
    }

    return {
      app: mergedApp,
      ticket: { ...base.ticket, ...override.ticket },
      ui: { ...base.ui, ...override.ui },
      storage: { ...base.storage, ...override.storage },
    }
  }

  /**
   * Get configuration summary for debugging
   */
  static getSummary(config: CompleteConfigurationSchema): string {
    return `Configuration Summary:
  Environment: ${config.app.environment}
  Project Type: ${config.ticket.defaultType}
  UI Theme: ${config.ui.theme}
  Storage: ${config.storage.xdgCompliant ? 'XDG Compliant' : 'Custom Path'}
  Features: ${[
    config.app.telemetryEnabled && 'Telemetry',
    config.ticket.enableComments && 'Comments',
    config.ticket.enableAttachments && 'Attachments',
    config.ui.enableColorOutput && 'Color Output',
    config.storage.backupEnabled && 'Backups',
  ]
    .filter(Boolean)
    .join(', ')}`
  }

  /**
   * Convert configuration to environment variables
   */
  static toEnvironmentVariables(config: CompleteConfigurationSchema): Record<string, string> {
    return {
      PM_APP_NAME: config.app.name,
      PM_APP_VERSION: config.app.version,
      PM_APP_ENVIRONMENT: config.app.environment,
      PM_APP_DEBUG: String(config.app.debug),
      PM_APP_TELEMETRY_ENABLED: String(config.app.telemetryEnabled),
      PM_TICKET_DEFAULTPRIORITY: config.ticket.defaultPriority,
      PM_TICKET_DEFAULTTYPE: config.ticket.defaultType,
      PM_UI_OUTPUTFORMAT: config.ui.outputFormat,
      PM_UI_THEME: config.ui.theme,
      PM_STORAGE_XDGCOMPLIANT: String(config.storage.xdgCompliant),
      PM_STORAGE_BACKUPENABLED: String(config.storage.backupEnabled),
    }
  }
}
