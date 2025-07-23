/**
 * Pino Logger Infrastructure Implementation
 *
 * High-performance logger adapter using Pino with sonic-boom for concurrent writes.
 * Supports multi-process safety, file rotation, and environment-specific configuration.
 */

import { EventEmitter } from 'node:events'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { LoggingError } from '@project-manager/application'
import type {
  LogConfig,
  LogContext,
  Logger,
  LogLevel,
  LogMetadata,
} from '@project-manager/base/common/logging'
import pino, { type LoggerOptions, type Logger as PinoLogger } from 'pino'

/**
 * Transport configuration.
 */
export interface TransportConfig {
  type: 'console' | 'file' | 'memory'
  maxEntries?: number // For memory transport
}

/**
 * Log rotation configuration.
 */
export interface RotationConfig {
  maxSize?: string
  maxFiles?: number
  interval?: 'daily' | 'weekly'
}

/**
 * Pino-specific configuration options.
 */
export interface PinoLoggerConfig extends LogConfig {
  /** Transport configuration */
  transport: TransportConfig

  /** Rotation configuration for file transport */
  rotation?: RotationConfig

  /** Pino-specific options */
  pino?: {
    /** Custom serializers */
    serializers?: Record<string, (obj: any) => any>

    /** Enable/disable timestamp */
    timestamp?: boolean | (() => string)

    /** Custom formatters */
    formatters?: {
      level?: (label: string, number: number) => object
      log?: (object: Record<string, unknown>) => Record<string, unknown>
    }

    /** Hook functions */
    hooks?: {
      logMethod?: (inputArgs: any[], method: any) => void
    }

    /** Custom levels */
    customLevels?: Record<string, number>
  }
}

/**
 * Memory-efficient circular buffer for in-memory logging.
 */
class CircularBuffer<T> {
  private buffer: T[]
  private size: number
  private index: number = 0
  private count: number = 0

  constructor(size: number) {
    this.size = size
    this.buffer = new Array(size)
  }

  add(item: T): void {
    this.buffer[this.index] = item
    this.index = (this.index + 1) % this.size
    this.count = Math.min(this.count + 1, this.size)
  }

  getAll(): T[] {
    const result: T[] = []
    for (let i = 0; i < this.count; i++) {
      const idx = (this.index - this.count + i + this.size) % this.size
      result.push(this.buffer[idx]!)
    }
    return result
  }

  clear(): void {
    this.buffer.fill(undefined as any)
    this.index = 0
    this.count = 0
  }

  get length(): number {
    return this.count
  }
}

/**
 * Performance metrics for monitoring logger performance.
 */
interface PerformanceMetrics {
  logsPerSecond: number
  avgWriteTime: number
  totalWrites: number
  failedWrites: number
  startTime: number
  lastFlush: number
}

/**
 * Pino logger implementation with advanced features.
 */
export class PinoLoggerAdapter extends EventEmitter implements Logger {
  private pinoLogger: PinoLogger
  private config: PinoLoggerConfig
  private memoryBuffer?: CircularBuffer<any>
  private metrics: PerformanceMetrics

  constructor(config: PinoLoggerConfig) {
    super()
    this.config = config
    this.metrics = {
      logsPerSecond: 0,
      avgWriteTime: 0,
      totalWrites: 0,
      failedWrites: 0,
      startTime: Date.now(),
      lastFlush: Date.now(),
    }

    this.pinoLogger = this.createPinoLogger()
    this.setupErrorHandling()

    // Initialize memory buffer if using memory transport
    if (config.transport.type === 'memory') {
      const maxEntries = config.transport.maxEntries || 10000
      this.memoryBuffer = new CircularBuffer(maxEntries)
    }
  }

  /**
   * Create the underlying Pino logger instance.
   */
  private createPinoLogger(): PinoLogger {
    const pinoOptions: LoggerOptions = {
      level: this.config.level || 'info',
      ...this.config.pino,
    }

    // Configure transport
    let destination: any

    switch (this.config.transport.type) {
      case 'console':
        destination = this.createConsoleTransport()
        break

      case 'file':
        destination = this.createFileTransport()
        break

      case 'memory':
        // Memory transport doesn't need a destination
        destination = undefined
        break

      default:
        destination = process.stdout
    }

    return destination ? pino(pinoOptions, destination) : pino(pinoOptions)
  }

  /**
   * Create console transport with pretty printing for development.
   */
  private createConsoleTransport() {
    if (this.config.environment === 'development') {
      try {
        // Use pino-pretty for development
        return pino.transport({
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        })
      } catch (_error) {
        // Fallback to stdout if pino-pretty is not available
        console.warn('pino-pretty not available, using plain console output')
        return process.stdout
      }
    }

    return process.stdout
  }

  /**
   * Create file transport with synchronous writing for log integrity.
   */
  private createFileTransport() {
    if (!this.config.logFile) {
      throw new LoggingError(
        'file-transport-creation',
        'Log file path is required for file transport'
      )
    }

    const filePath = resolve(this.config.logFile)

    // Ensure directory exists
    this.ensureDirectoryExists(dirname(filePath))

    // Use pino's built-in file transport with sync option
    return pino.transport({
      target: 'pino/file',
      options: {
        destination: filePath,
        mkdir: true,
        append: true,
        sync: true, // Force synchronous writes for log integrity
        ...this.convertRotationConfig(),
      },
    })
  }

  /**
   * Convert rotation configuration to pino format.
   */
  private convertRotationConfig() {
    if (!this.config.rotation) return {}

    const rotation = this.config.rotation
    const config: any = {}

    if (rotation?.maxSize) {
      // Convert size string to bytes
      const sizeMatch = rotation.maxSize.match(/^(\d+)\s*(MB|GB|KB)?$/i)
      if (sizeMatch) {
        const size = parseInt(sizeMatch[1]!)
        const unit = (sizeMatch[2] || '').toUpperCase()

        switch (unit) {
          case 'KB':
            config.maxSize = size * 1024
            break
          case 'MB':
            config.maxSize = size * 1024 * 1024
            break
          case 'GB':
            config.maxSize = size * 1024 * 1024 * 1024
            break
          default:
            config.maxSize = size
        }
      }
    }

    if (rotation.maxFiles) {
      config.maxFiles = rotation.maxFiles
    }

    if (rotation.interval) {
      config.datePattern = rotation.interval === 'daily' ? 'YYYY-MM-DD' : 'YYYY-[W]WW'
    }

    return config
  }

  /**
   * Ensure directory exists for log files.
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await mkdir(dirPath, { recursive: true })
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw new LoggingError(
          'directory-creation',
          `Failed to create log directory: ${error.message}`,
          {},
          error
        )
      }
    }
  }

  /**
   * Setup error handling for the logger.
   */
  private setupErrorHandling(): void {
    // Note: Pino doesn't have an 'error' event by default
    // Error handling is done through the transport layer

    // Handle uncaught exceptions
    process.on('uncaughtException', error => {
      this.handleCriticalError('Uncaught Exception', error)
    })

    process.on('unhandledRejection', reason => {
      this.handleCriticalError('Unhandled Rejection', reason)
    })
  }

  /**
   * Handle logging errors with fallback mechanisms.
   */
  private handleLogError(error: any): void {
    this.metrics.failedWrites++
    this.emit('error', error)

    // Try fallback logging
    try {
      if (this.config.transport.type !== 'console') {
        console.error('[LOGGER ERROR]', error.message)
      }
    } catch (_fallbackError) {
      // Last resort: do nothing to prevent error loops
    }
  }

  /**
   * Handle critical errors that require immediate attention.
   */
  private handleCriticalError(type: string, error: any): void {
    try {
      // Force synchronous write for critical errors
      const errorMessage = `[CRITICAL ${type}] ${error?.message || error} at ${new Date().toISOString()}\n`

      if (process.stderr.writable) {
        process.stderr.write(errorMessage)
      }

      // Also try to log normally if possible
      this.pinoLogger.fatal?.(error, `Critical ${type}`)
    } catch (_logError) {
      // Ensure we don't create error loops
    }
  }

  /**
   * Record performance metrics for each log operation.
   */
  private recordMetrics(startTime: number, success: boolean): void {
    const duration = Date.now() - startTime
    this.metrics.totalWrites++

    if (success) {
      // Calculate running average
      this.metrics.avgWriteTime =
        (this.metrics.avgWriteTime * (this.metrics.totalWrites - 1) + duration) /
        this.metrics.totalWrites
    } else {
      this.metrics.failedWrites++
    }

    // Update throughput every second
    const now = Date.now()
    if (now - this.metrics.lastFlush >= 1000) {
      const elapsed = (now - this.metrics.startTime) / 1000
      this.metrics.logsPerSecond = this.metrics.totalWrites / elapsed
      this.metrics.lastFlush = now
    }
  }

  /**
   * Log debug message.
   */
  async debug(message: string, metadata?: LogMetadata): Promise<void> {
    const startTime = Date.now()

    try {
      if (this.config.transport.type === 'memory' && this.memoryBuffer) {
        this.memoryBuffer.add({
          level: 'debug',
          message,
          metadata,
          timestamp: new Date().toISOString(),
        })
      } else {
        this.pinoLogger.debug(metadata || {}, message)
      }

      this.recordMetrics(startTime, true)
    } catch (error) {
      this.handleLogError(error)
      this.recordMetrics(startTime, false)
    }
  }

  /**
   * Log info message.
   */
  async info(message: string, metadata?: LogMetadata): Promise<void> {
    const startTime = Date.now()

    try {
      if (this.config.transport.type === 'memory' && this.memoryBuffer) {
        this.memoryBuffer.add({
          level: 'info',
          message,
          metadata,
          timestamp: new Date().toISOString(),
        })
      } else {
        this.pinoLogger.info(metadata || {}, message)
      }

      this.recordMetrics(startTime, true)
    } catch (error) {
      this.handleLogError(error)
      this.recordMetrics(startTime, false)
    }
  }

  /**
   * Log warn message.
   */
  async warn(message: string, metadata?: LogMetadata): Promise<void> {
    const startTime = Date.now()

    try {
      if (this.config.transport.type === 'memory' && this.memoryBuffer) {
        this.memoryBuffer.add({
          level: 'warn',
          message,
          metadata,
          timestamp: new Date().toISOString(),
        })
      } else {
        this.pinoLogger.warn(metadata || {}, message)
      }

      this.recordMetrics(startTime, true)
    } catch (error) {
      this.handleLogError(error)
      this.recordMetrics(startTime, false)
    }
  }

  /**
   * Log error message.
   */
  async error(message: string, metadata?: LogMetadata): Promise<void> {
    const startTime = Date.now()

    try {
      if (this.config.transport.type === 'memory' && this.memoryBuffer) {
        this.memoryBuffer.add({
          level: 'error',
          message,
          metadata,
          timestamp: new Date().toISOString(),
        })
      } else {
        this.pinoLogger.error(metadata || {}, message)
      }

      this.recordMetrics(startTime, true)
    } catch (error) {
      this.handleLogError(error)
      this.recordMetrics(startTime, false)
    }
  }

  /**
   * Create a child logger with persistent context.
   */
  child(context: LogContext): Logger {
    const childPinoLogger = this.pinoLogger.child(context)

    // Create a child adapter that shares the same configuration
    const childAdapter = new PinoLoggerAdapter({
      ...this.config,
      // Don't create new transports for child loggers
    })

    // Replace the child's pino instance with the actual child logger
    ;(childAdapter as any).pinoLogger = childPinoLogger

    // Share memory buffer if using memory transport
    if (this.memoryBuffer) {
      ;(childAdapter as any).memoryBuffer = this.memoryBuffer
    }

    return childAdapter
  }

  /**
   * Flush all pending log entries.
   */
  async flush(): Promise<void> {
    try {
      // Pino doesn't have a direct flush method, but we can access the stream
      const stream = (this.pinoLogger as any).stream

      if (stream && typeof stream.flush === 'function') {
        await new Promise<void>((resolve, reject) => {
          stream.flush((error?: Error) => {
            if (error) {
              reject(error)
            } else {
              resolve()
            }
          })
        })
      } else if (stream && typeof stream.flushSync === 'function') {
        stream.flushSync()
      }
    } catch (error) {
      this.handleLogError(error)
    }
  }

  /**
   * Get current performance metrics.
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Get memory buffer contents (for memory transport).
   */
  getMemoryLogs(): any[] {
    return this.memoryBuffer?.getAll() || []
  }

  /**
   * Clear memory buffer (for memory transport).
   */
  clearMemoryLogs(): void {
    this.memoryBuffer?.clear()
  }

  /**
   * Check if logger is healthy.
   */
  isHealthy(): boolean {
    // Consider logger unhealthy if error rate is too high
    const errorRate =
      this.metrics.totalWrites > 0 ? this.metrics.failedWrites / this.metrics.totalWrites : 0

    return errorRate < 0.1 // Less than 10% error rate
  }

  /**
   * Get logger configuration.
   */
  getConfig(): PinoLoggerConfig {
    return { ...this.config }
  }

  /**
   * Update logger level dynamically.
   */
  setLevel(level: LogLevel): void {
    this.pinoLogger.level = level
    this.config.level = level
  }

  /**
   * Destroy the logger and clean up resources.
   */
  async destroy(): Promise<void> {
    try {
      await this.flush()

      // Close stream if available
      const stream = (this.pinoLogger as any).stream
      if (stream && typeof stream.end === 'function') {
        stream.end()
      }

      this.removeAllListeners()
    } catch (error) {
      console.error('Error destroying logger:', error)
    }
  }
}

/**
 * Create development-optimized logger.
 */
export function createDevelopmentLogger(overrides?: Partial<PinoLoggerConfig>): Logger {
  const config: PinoLoggerConfig = {
    level: 'debug',
    environment: 'development',
    transportType: 'console',
    transport: { type: 'console' },
    pino: {
      timestamp: true,
    },
    ...overrides,
  }

  return new PinoLoggerAdapter(config)
}

/**
 * Create production-optimized logger.
 */
export function createProductionLogger(
  logPath: string,
  overrides?: Partial<PinoLoggerConfig>
): Logger {
  const config: PinoLoggerConfig = {
    level: 'info',
    environment: 'production',
    transportType: 'file',
    logFile: logPath,
    transport: { type: 'file' },
    rotation: {
      maxSize: '100MB',
      maxFiles: 30,
    },
    pino: {
      timestamp: true,
    },
    ...overrides,
  }

  return new PinoLoggerAdapter(config)
}

/**
 * Create test-optimized logger.
 */
export function createTestLogger(overrides?: Partial<PinoLoggerConfig>): Logger {
  const config: PinoLoggerConfig = {
    level: 'error',
    environment: 'testing',
    transportType: 'memory',
    transport: { type: 'memory', maxEntries: 1000 },
    ...overrides,
  }

  return new PinoLoggerAdapter(config)
}
