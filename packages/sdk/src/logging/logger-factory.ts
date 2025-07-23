/**
 * Logger Factory for SDK Integration
 *
 * Provides centralized logger management with dependency injection integration,
 * configuration management, and lifecycle handling for the SDK layer.
 */

import type {
  AuditLogger,
  LogConfig,
  LogContext,
  Logger,
  LogLevel,
} from '@project-manager/base/common/logging'
import {
  CrossPlatformStorageConfigService,
  createComplianceAuditLogger,
  createDevelopmentAuditLogger,
  createDevelopmentLogger,
  createProductionLogger,
  createTestLogger,
  FileAuditLogger,
  type FileAuditLoggerConfig,
  type PinoLoggerConfig,
} from '@project-manager/infrastructure'
import { EventEmitter } from 'events'
import { join, resolve } from 'path'

/**
 * Configuration for the logger factory.
 */
export interface LoggerFactoryConfig {
  /** Environment configuration */
  environment?: 'development' | 'production' | 'testing'

  /** Default log level for all loggers */
  defaultLogLevel?: LogLevel

  /** Application logger configuration */
  application?: {
    /** Log level */
    level?: LogLevel

    /** Transport type */
    transport?: 'console' | 'file' | 'memory'

    /** File configuration */
    file?: {
      path?: string
      rotation?: {
        enabled?: boolean
        maxSize?: string
        maxFiles?: number
      }
    }

    /** Performance settings */
    performance?: {
      asyncLogging?: boolean
      bufferSize?: number
      flushInterval?: number
    }
  }

  /** Audit logger configuration */
  audit?: {
    /** Enable audit logging */
    enabled?: boolean

    /** Audit file path */
    path?: string

    /** File rotation */
    rotation?: {
      enabled?: boolean
      maxSize?: string
      maxFiles?: number
      compress?: boolean
    }

    /** Data retention */
    retention?: {
      days?: number
      automaticCleanup?: boolean
    }
  }
}

/**
 * Logger instance cache for performance optimization.
 */
class LoggerCache {
  private cache = new Map<string, Logger>()

  get(key: string): Logger | undefined {
    return this.cache.get(key)
  }

  set(key: string, logger: Logger): void {
    this.cache.set(key, logger)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

/**
 * Lazy initialization wrapper for logger instances.
 */
class LazyLogger<T> {
  private _instance?: T
  private _factory: () => T

  constructor(factory: () => T) {
    this._factory = factory
  }

  get instance(): T {
    if (!this._instance) {
      this._instance = this._factory()
    }
    return this._instance
  }

  isInitialized(): boolean {
    return this._instance !== undefined
  }
}

/**
 * Centralized logger factory with dependency injection support.
 */
export class LoggerFactory extends EventEmitter {
  private config: LoggerFactoryConfig
  private applicationLogger: LazyLogger<Logger>
  private auditLogger: LazyLogger<AuditLogger>
  private loggerCache: LoggerCache
  private isInitialized = false
  private isShuttingDown = false
  private readonly storageService: CrossPlatformStorageConfigService

  constructor(config: LoggerFactoryConfig = {}) {
    super()
    this.config = this.mergeWithDefaults(config)
    this.loggerCache = new LoggerCache()
    this.storageService = new CrossPlatformStorageConfigService()

    // Initialize lazy loggers
    this.applicationLogger = new LazyLogger(() => this.createApplicationLoggerInstance())
    this.auditLogger = new LazyLogger(() => this.createAuditLoggerInstance())
  }

  /**
   * Merge user configuration with defaults.
   */
  private mergeWithDefaults(userConfig: LoggerFactoryConfig): LoggerFactoryConfig {
    const environment = userConfig.environment || this.detectEnvironment()

    const defaults: LoggerFactoryConfig = {
      environment,
      defaultLogLevel: this.getDefaultLogLevel(environment),
      application: {
        level: undefined, // Will use defaultLogLevel
        transport: 'file', // Always use file transport for both development and production
        file: {
          path: 'logs/app.log',
          rotation: {
            enabled: environment === 'production',
            maxSize: environment === 'production' ? '100MB' : '10MB',
            maxFiles: environment === 'production' ? 30 : 5,
          },
        },
        performance: {
          asyncLogging: false, // Always sync logging for integrity
          bufferSize: environment === 'production' ? 32768 : 16384,
          flushInterval: environment === 'production' ? 2000 : 5000,
        },
      },
      audit: {
        enabled: true,
        path: 'logs/audit.log',
        rotation: {
          enabled: true,
          maxSize: '50MB',
          maxFiles: environment === 'production' ? 100 : 10,
          compress: environment === 'production',
        },
        retention: {
          days: environment === 'production' ? 2555 : 30, // 7 years for production
          automaticCleanup: environment !== 'production',
        },
      },
    }

    return this.deepMerge(defaults, userConfig)
  }

  /**
   * Deep merge configuration objects.
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target }

    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key])
      } else if (source[key] !== undefined) {
        result[key] = source[key]
      }
    }

    return result
  }

  /**
   * Detect environment from process.env.
   */
  private detectEnvironment(): 'development' | 'production' | 'testing' {
    const nodeEnv = process.env.NODE_ENV?.toLowerCase()

    if (nodeEnv === 'production') return 'production'
    if (nodeEnv === 'test') return 'testing'
    return 'development'
  }

  /**
   * Get default log level for environment.
   */
  private getDefaultLogLevel(environment: string): LogLevel {
    switch (environment) {
      case 'production':
        return 'info'
      case 'testing':
        return 'error'
      default:
        return 'debug'
    }
  }

  /**
   * Initialize the logger factory and all loggers.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Initialize loggers if they need async initialization
      const initPromises: Promise<void>[] = []

      if (this.applicationLogger.isInitialized()) {
        const appLogger = this.applicationLogger.instance
        if (typeof (appLogger as any).initialize === 'function') {
          initPromises.push((appLogger as any).initialize())
        }
      }

      if (this.auditLogger.isInitialized()) {
        const audLogger = this.auditLogger.instance
        if (typeof (audLogger as any).initialize === 'function') {
          initPromises.push((audLogger as any).initialize())
        }
      }

      await Promise.all(initPromises)

      this.isInitialized = true
      this.emit('initialized')
    } catch (error) {
      this.emit('error', { message: 'Failed to initialize logger factory', error })
      throw error
    }
  }

  /**
   * Create the main application logger instance.
   */
  private createApplicationLoggerInstance(): Logger {
    try {
      const appConfig = this.config.application!
      const logLevel = appConfig.level || this.config.defaultLogLevel!

      // Get actual log path from XDG storage service
      const actualLogPath = this.getActualLogPath(appConfig)

      const pinoConfig: PinoLoggerConfig = {
        level: logLevel,
        transport: { type: appConfig.transport! },
        environment: this.config.environment!,
        logFile: actualLogPath,
        rotation: appConfig.file?.rotation
          ? {
              maxSize: appConfig.file.rotation.maxSize || '10MB',
              maxFiles: appConfig.file.rotation.maxFiles || 5,
            }
          : undefined,
        pino: {
          timestamp: true,
        },
      }

      // Use factory functions for different environments
      switch (this.config.environment) {
        case 'production':
          return createProductionLogger(actualLogPath || 'logs/app.log', pinoConfig)

        case 'testing':
          return createTestLogger(pinoConfig)

        default:
          return createDevelopmentLogger(pinoConfig)
      }
    } catch (error) {
      this.emit('error', { message: 'Failed to create application logger', error })

      // Return fallback console logger
      return this.createFallbackLogger()
    }
  }

  /**
   * Get actual log path using cross-platform directory service.
   */
  private getActualLogPath(appConfig: any): string {
    if (appConfig.file?.path) {
      // If absolute path, use as-is
      if (
        appConfig.file.path.startsWith('/') ||
        (appConfig.file.path.length > 1 && appConfig.file.path[1] === ':')
      ) {
        return appConfig.file.path
      }

      // If relative path, resolve against cross-platform logs directory
      const logsDir = this.storageService.getLogsPath(this.config.environment)
      return join(logsDir, 'app.log')
    }

    // Default: use cross-platform logs directory
    const logsDir = this.storageService.getLogsPath(this.config.environment)
    return join(logsDir, 'app.log')
  }

  /**
   * Get actual audit log path using cross-platform directory service.
   */
  private getActualAuditPath(auditConfig: any): string {
    if (auditConfig.path) {
      // If absolute path, use as-is
      if (
        auditConfig.path.startsWith('/') ||
        (auditConfig.path.length > 1 && auditConfig.path[1] === ':')
      ) {
        return auditConfig.path
      }

      // If relative path, resolve against cross-platform logs directory
      const logsDir = this.storageService.getLogsPath(this.config.environment)
      return join(logsDir, 'audit.log')
    }

    // Default: use cross-platform logs directory
    const logsDir = this.storageService.getLogsPath(this.config.environment)
    return join(logsDir, 'audit.log')
  }

  /**
   * Create the audit logger instance.
   */
  private createAuditLoggerInstance(): AuditLogger {
    try {
      if (!this.config.audit?.enabled) {
        return this.createNullAuditLogger()
      }

      const auditConfig = this.config.audit!

      // Get actual audit log path using XDG Base Directory specification
      const actualAuditPath = this.getActualAuditPath(auditConfig)

      const fileAuditConfig: FileAuditLoggerConfig = {
        auditFile: {
          path: actualAuditPath,
          rotation: auditConfig.rotation
            ? {
                enabled: auditConfig.rotation.enabled || false,
                ...auditConfig.rotation,
              }
            : undefined,
        },
        appendOnly: true,
        integrityCheck: this.config.environment === 'production',
        retention: auditConfig.retention
          ? {
              days: auditConfig.retention.days || 365,
              automaticCleanup: auditConfig.retention.automaticCleanup || false,
              ...auditConfig.retention,
            }
          : undefined,
        performance: {
          sync: this.config.environment === 'production',
          bufferSize: 8192,
          batchSize: this.config.environment === 'production' ? 10 : 50,
          flushInterval: this.config.environment === 'production' ? 2000 : 5000,
        },
      }

      // Use factory functions for different environments
      const baseLogger = this.createApplicationLoggerInstance()
      switch (this.config.environment) {
        case 'production':
          return createComplianceAuditLogger(actualAuditPath, baseLogger, fileAuditConfig)

        default:
          return createDevelopmentAuditLogger(actualAuditPath, baseLogger, fileAuditConfig)
      }
    } catch (error) {
      this.emit('error', { message: 'Failed to create audit logger', error })

      // Return null audit logger as fallback
      return this.createNullAuditLogger()
    }
  }

  /**
   * Create fallback console logger.
   */
  private createFallbackLogger(): Logger {
    const fallbackLogger: Logger = {
      async debug(message: string, metadata?: any): Promise<void> {
        console.debug(`[DEBUG] ${message}`, metadata)
      },

      async info(message: string, metadata?: any): Promise<void> {
        console.info(`[INFO] ${message}`, metadata)
      },

      async warn(message: string, metadata?: any): Promise<void> {
        console.warn(`[WARN] ${message}`, metadata)
      },

      async error(message: string, metadata?: any): Promise<void> {
        console.error(`[ERROR] ${message}`, metadata)
      },

      child(context: LogContext): Logger {
        // Return same logger for fallback
        return this
      },

      async flush(): Promise<void> {
        // No-op for console logger
      },
    }

    return fallbackLogger
  }

  /**
   * Create contextual fallback logger.
   */
  private createContextualFallbackLogger(context: LogContext): Logger {
    const contextStr = JSON.stringify(context)

    const contextualLogger: Logger = {
      async debug(message: string, metadata?: any): Promise<void> {
        console.debug(`[DEBUG] ${contextStr} ${message}`, metadata)
      },

      async info(message: string, metadata?: any): Promise<void> {
        console.info(`[INFO] ${contextStr} ${message}`, metadata)
      },

      async warn(message: string, metadata?: any): Promise<void> {
        console.warn(`[WARN] ${contextStr} ${message}`, metadata)
      },

      async error(message: string, metadata?: any): Promise<void> {
        console.error(`[ERROR] ${contextStr} ${message}`, metadata)
      },

      child(childContext: LogContext): Logger {
        // Return same logger for fallback
        return this
      },

      async flush(): Promise<void> {
        // No-op for console logger
      },
    }

    return contextualLogger
  }

  /**
   * Create null audit logger (no-op implementation).
   */
  private createNullAuditLogger(): AuditLogger {
    const nullAuditLogger: AuditLogger = {
      async recordCreate(): Promise<void> {
        // No-op
      },

      async recordUpdate(): Promise<void> {
        // No-op
      },

      async recordDelete(): Promise<void> {
        // No-op
      },

      async queryEvents(): Promise<any[]> {
        return []
      },

      async getStatistics(): Promise<any> {
        return {
          period: { start: '', end: '' },
          totalOperations: 0,
          operationsByType: {},
          operationsByActor: {},
          operationsByEntity: {},
          operationsBySource: {},
          operationsByRisk: {},
          mostActiveActors: [],
          mostModifiedEntities: [],
          compliance: {
            sensitiveDataOperations: 0,
            byDataClassification: {},
            requiresRetention: 0,
          },
        }
      },
    }

    return nullAuditLogger
  }

  /**
   * Get the main application logger.
   */
  getApplicationLogger(): Logger {
    return this.applicationLogger.instance
  }

  /**
   * Get the audit logger.
   */
  getAuditLogger(): AuditLogger {
    return this.auditLogger.instance
  }

  /**
   * Get a named logger instance with caching.
   */
  getLogger(name: string, context?: LogContext): Logger {
    const cacheKey = context ? `${name}:${JSON.stringify(context)}` : name

    // Check cache first
    const cachedLogger = this.loggerCache.get(cacheKey)
    if (cachedLogger) {
      return cachedLogger
    }

    // Create new logger instance
    const baseLogger = this.getApplicationLogger()
    const namedContext: LogContext = {
      component: name,
      ...context,
    }

    const namedLogger = baseLogger.child(namedContext)

    // Cache the logger
    this.loggerCache.set(cacheKey, namedLogger)

    return namedLogger
  }

  /**
   * Create a logger for a specific architectural layer.
   */
  getLayerLogger(
    layer: 'domain' | 'application' | 'infrastructure' | 'sdk' | 'cli' | 'mcp',
    context?: LogContext
  ): Logger {
    return this.getLogger(`${layer}-layer`, { layer, ...context })
  }

  /**
   * Create a logger for a specific component.
   */
  getComponentLogger(component: string, context?: LogContext): Logger {
    return this.getLogger(component, { component, ...context })
  }

  /**
   * Create a logger for a specific operation.
   */
  getOperationLogger(operation: string, context?: LogContext): Logger {
    return this.getLogger(`operation-${operation}`, { operation, ...context })
  }

  /**
   * Check if the logger factory is healthy.
   */
  isHealthy(): boolean {
    if (this.isShuttingDown) return false

    try {
      // Check application logger health
      const appLogger = this.applicationLogger.instance
      if (typeof (appLogger as any).isHealthy === 'function' && !(appLogger as any).isHealthy()) {
        return false
      }

      // Check audit logger health
      const audLogger = this.auditLogger.instance
      if (typeof (audLogger as any).isHealthy === 'function' && !(audLogger as any).isHealthy()) {
        return false
      }

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get current configuration.
   */
  getConfig(): LoggerFactoryConfig {
    return { ...this.config }
  }

  /**
   * Get cache statistics.
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.loggerCache.size(),
      keys: Array.from((this.loggerCache as any).cache.keys()),
    }
  }

  /**
   * Clear logger cache.
   */
  clearCache(): void {
    this.loggerCache.clear()
    this.emit('cacheCleared')
  }

  /**
   * Flush all loggers.
   */
  async flush(): Promise<void> {
    const flushPromises: Promise<void>[] = []

    if (this.applicationLogger.isInitialized()) {
      flushPromises.push(this.applicationLogger.instance.flush())
    }

    if (this.auditLogger.isInitialized()) {
      const audLogger = this.auditLogger.instance as any
      if (typeof audLogger.flush === 'function') {
        flushPromises.push(audLogger.flush())
      }
    }

    await Promise.all(flushPromises)
  }

  /**
   * Shutdown all loggers and clean up resources.
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) return

    this.isShuttingDown = true

    try {
      // Flush all pending operations
      await this.flush()

      // Close loggers
      const closePromises: Promise<void>[] = []

      if (this.applicationLogger.isInitialized()) {
        const appLogger = this.applicationLogger.instance as any
        if (typeof appLogger.destroy === 'function') {
          closePromises.push(appLogger.destroy())
        } else if (typeof appLogger.close === 'function') {
          closePromises.push(appLogger.close())
        }
      }

      if (this.auditLogger.isInitialized()) {
        const audLogger = this.auditLogger.instance as any
        if (typeof audLogger.close === 'function') {
          closePromises.push(audLogger.close())
        }
      }

      await Promise.all(closePromises)

      // Clear cache and listeners
      this.clearCache()
      this.removeAllListeners()

      this.emit('shutdown')
    } catch (error) {
      this.emit('error', { message: 'Error during shutdown', error })
      throw error
    }
  }
}

/**
 * Global logger factory instance (singleton).
 */
let globalLoggerFactory: LoggerFactory | null = null

/**
 * Get or create the global logger factory instance.
 */
export function getGlobalLoggerFactory(config?: LoggerFactoryConfig): LoggerFactory {
  if (!globalLoggerFactory) {
    globalLoggerFactory = new LoggerFactory(config)
  }
  return globalLoggerFactory
}

/**
 * Create a new logger factory instance.
 */
export function createLoggerFactory(config: LoggerFactoryConfig = {}): LoggerFactory {
  return new LoggerFactory(config)
}

/**
 * Load configuration from environment variables.
 */
export function loadConfigFromEnvironment(): LoggerFactoryConfig {
  const config: LoggerFactoryConfig = {}

  if (process.env.NODE_ENV) {
    config.environment = process.env.NODE_ENV as any
  }

  if (process.env.LOG_LEVEL) {
    config.defaultLogLevel = process.env.LOG_LEVEL as LogLevel
  }

  if (process.env.LOG_FILE_PATH) {
    config.application = {
      ...config.application,
      transport: 'file',
      file: {
        path: process.env.LOG_FILE_PATH,
      },
    }
  }

  if (process.env.AUDIT_ENABLED) {
    config.audit = {
      ...config.audit,
      enabled: process.env.AUDIT_ENABLED.toLowerCase() === 'true',
    }
  }

  if (process.env.AUDIT_FILE_PATH) {
    config.audit = {
      ...config.audit,
      path: process.env.AUDIT_FILE_PATH,
    }
  }

  return config
}

/**
 * Dependency injection registration helpers.
 */
export const LoggerFactoryDI = {
  /**
   * Register logger factory in a DI container.
   */
  register<T>(container: any, config?: LoggerFactoryConfig): void {
    // Register as singleton
    container.registerSingleton('LoggerFactory', () => {
      return createLoggerFactory(config)
    })

    // Register application logger
    container.registerTransient('Logger', (c: any) => {
      const factory: LoggerFactory = c.resolve('LoggerFactory')
      return factory.getApplicationLogger()
    })

    // Register audit logger
    container.registerSingleton('AuditLogger', (c: any) => {
      const factory: LoggerFactory = c.resolve('LoggerFactory')
      return factory.getAuditLogger()
    })

    // Register named logger factory
    container.registerTransient('NamedLogger', (c: any, name: string, context?: LogContext) => {
      const factory: LoggerFactory = c.resolve('LoggerFactory')
      return factory.getLogger(name, context)
    })
  },

  /**
   * Create initialization function for DI containers.
   */
  createInitializer(config?: LoggerFactoryConfig) {
    return async (container: any) => {
      const factory: LoggerFactory = container.resolve('LoggerFactory')
      await factory.initialize()
    }
  },

  /**
   * Create shutdown function for DI containers.
   */
  createShutdown() {
    return async (container: any) => {
      const factory: LoggerFactory = container.resolve('LoggerFactory')
      await factory.shutdown()
    }
  },
}
