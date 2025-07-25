/**
 * Logger Factory for SDK Integration
 *
 * Provides centralized logger management with dependency injection integration,
 * configuration management, and lifecycle handling for the SDK layer.
 */

import type { ApplicationEventEmitter, EventEmitterFactory } from '@project-manager/application'
import type {
  AuditLogger,
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
  defaultEventEmitterFactory,
  type FileAuditLoggerConfig,
  type SyncLoggerConfig,
} from '@project-manager/infrastructure'

/**
 * Configuration for the logger factory.
 */
export interface LoggerFactoryConfig {
  /** Environment configuration */
  environment?: 'development' | 'production' | 'testing'

  /** Default log level for all loggers */
  defaultLogLevel?: LogLevel

  /** Event emitter factory for creating event emitters */
  eventEmitterFactory?: EventEmitterFactory

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
export class LoggerFactory {
  private config: LoggerFactoryConfig
  private applicationLogger: LazyLogger<Logger>
  private auditLogger: LazyLogger<AuditLogger>
  private loggerCache: LoggerCache
  private isInitialized = false
  private isShuttingDown = false
  private readonly storageService: CrossPlatformStorageConfigService
  private readonly eventEmitter: ApplicationEventEmitter

  constructor(config: LoggerFactoryConfig = {}) {
    this.config = this.mergeWithDefaults(config)
    this.loggerCache = new LoggerCache()
    this.storageService = new CrossPlatformStorageConfigService()

    // Initialize event emitter using the factory from config or default
    const eventEmitterFactory = config.eventEmitterFactory || defaultEventEmitterFactory
    this.eventEmitter = eventEmitterFactory.create()

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
      eventEmitterFactory: defaultEventEmitterFactory,
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
      const initPromises: undefined[] = []

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
      this.eventEmitter.emit('initialized')
    } catch (error) {
      this.eventEmitter.emit('error', { message: 'Failed to initialize logger factory', error })
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

      const syncConfig: SyncLoggerConfig = {
        level: logLevel,
        environment: this.config.environment!,
        transportType: appConfig.transport!,
        logFile: actualLogPath,
        colorize: this.config.environment === 'development',
        timestampFormat: this.config.environment === 'production' ? 'iso' : 'locale',
      }

      // Use factory functions for different environments
      switch (this.config.environment) {
        case 'production':
          return createProductionLogger(actualLogPath || 'logs/app.log', syncConfig)

        case 'testing':
          return createTestLogger(syncConfig)

        default:
          return createDevelopmentLogger(syncConfig)
      }
    } catch (error) {
      this.eventEmitter.emit('error', { message: 'Failed to create application logger', error })

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

      // If relative path, use the service to get full path
      return this.storageService.getApplicationLogPath('app.log')
    }

    // Default: use cross-platform logs directory service
    return this.storageService.getApplicationLogPath()
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

      // If relative path, use the service to get full path
      return this.storageService.getAuditLogPath('audit.log')
    }

    // Default: use cross-platform logs directory service
    return this.storageService.getAuditLogPath()
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
      this.eventEmitter.emit('error', { message: 'Failed to create audit logger', error })

      // Return null audit logger as fallback
      return this.createNullAuditLogger()
    }
  }

  /**
   * Create fallback console logger.
   */
  private createFallbackLogger(): Logger {
    const fallbackLogger: Logger = {
      debug(message: string, metadata?: any): void {
        console.debug(`[DEBUG] ${message}`, metadata)
      },

      info(message: string, metadata?: any): void {
        console.info(`[INFO] ${message}`, metadata)
      },

      warn(message: string, metadata?: any): void {
        console.warn(`[WARN] ${message}`, metadata)
      },

      error(message: string, metadata?: any): void {
        console.error(`[ERROR] ${message}`, metadata)
      },

      child(_context: LogContext): Logger {
        // Return same logger for fallback
        return this
      },
    }

    return fallbackLogger
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
    } catch (_error) {
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
    this.eventEmitter.emit('cacheCleared')
  }

  /**
   * Add event listener.
   */
  on(event: string, listener: (data?: any) => void): void {
    this.eventEmitter.on(event, listener)
  }

  /**
   * Remove event listener.
   */
  off(event: string, listener: (data?: any) => void): void {
    this.eventEmitter.off(event, listener)
  }

  /**
   * Remove all event listeners.
   */
  removeAllListeners(event?: string): void {
    this.eventEmitter.removeAllListeners(event)
  }

  /**
   * Shutdown logger factory and clear cache.
   * Properly close async resources like audit loggers.
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) return

    this.isShuttingDown = true

    try {
      // Close audit logger if it has async resources
      if (this.auditLogger.isInitialized()) {
        const audLogger = this.auditLogger.instance
        if (typeof (audLogger as any).close === 'function') {
          await (audLogger as any).close()
        }
      }

      // Close application logger if it has async resources
      if (this.applicationLogger.isInitialized()) {
        const appLogger = this.applicationLogger.instance
        if (typeof (appLogger as any).close === 'function') {
          await (appLogger as any).close()
        }
      }

      // Clear cache and listeners
      this.clearCache()
      this.eventEmitter.removeAllListeners()

      this.eventEmitter.emit('shutdown')
    } catch (error) {
      this.eventEmitter.emit('error', { message: 'Error during shutdown', error })
      // Don't re-throw to prevent hanging
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
 * Shutdown and reset the global logger factory instance.
 */
export async function shutdownGlobalLoggerFactory(): Promise<void> {
  if (globalLoggerFactory) {
    await globalLoggerFactory.shutdown()
    globalLoggerFactory = null
  }
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
  register<_T>(container: any, config?: LoggerFactoryConfig): void {
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
  createInitializer(_config?: LoggerFactoryConfig) {
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
