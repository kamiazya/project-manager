/**
 * Synchronous Logger Infrastructure Implementation
 *
 * Simple synchronous logger adapter that ensures immediate process termination.
 * Uses fs.writeFileSync and console.log for immediate, blocking I/O operations.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { LoggingError } from '@project-manager/application'
import type {
  LogConfig,
  LogContext,
  Logger,
  LogLevel,
  LogMetadata,
} from '@project-manager/base/common/logging'

/**
 * Transport configuration for synchronous logger.
 */
export interface SyncTransportConfig {
  type: 'console' | 'file' | 'memory'
}

/**
 * Sync-specific configuration options.
 */
export interface SyncLoggerConfig extends LogConfig {
  /** Transport configuration */
  transport: SyncTransportConfig

  /** Enable colorized console output */
  colorize?: boolean

  /** Custom timestamp format */
  timestampFormat?: 'iso' | 'locale' | 'epoch'
}

/**
 * Memory buffer for in-memory logging (synchronous) - unlimited storage.
 */
class SyncMemoryBuffer<T> {
  private buffer: T[] = []

  add(item: T): void {
    this.buffer.push(item)
  }

  getAll(): T[] {
    return [...this.buffer]
  }

  clear(): void {
    this.buffer = []
  }

  get length(): number {
    return this.buffer.length
  }
}

/**
 * Simple color codes for console output.
 */
const Colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
} as const

/**
 * Synchronous logger implementation with immediate I/O operations.
 */
export class SyncLoggerAdapter implements Logger {
  private config: SyncLoggerConfig
  private memoryBuffer?: SyncMemoryBuffer<any>
  private childContext?: LogContext

  constructor(config: SyncLoggerConfig, childContext?: LogContext) {
    this.config = config
    this.childContext = childContext

    // Initialize memory buffer if using memory transport
    if (config.transport.type === 'memory') {
      this.memoryBuffer = new SyncMemoryBuffer()
    }

    // Ensure log directory exists for file transport
    if (config.transport.type === 'file') {
      this.ensureDirectoryExists()
    }
  }

  /**
   * Ensure directory exists for log files (synchronous).
   */
  private ensureDirectoryExists(): void {
    if (!this.config.logFile) {
      throw new LoggingError(
        'file-transport-creation',
        'Log file path is required for file transport'
      )
    }

    const dirPath = dirname(resolve(this.config.logFile))

    if (!existsSync(dirPath)) {
      try {
        mkdirSync(dirPath, { recursive: true })
      } catch (error: any) {
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
   * Format timestamp based on configuration.
   */
  private formatTimestamp(): string {
    const now = new Date()

    switch (this.config.timestampFormat) {
      case 'epoch':
        return now.getTime().toString()
      case 'locale':
        return now.toLocaleString()
      case 'iso':
      default:
        return now.toISOString()
    }
  }

  /**
   * Format log entry for output.
   */
  private formatLogEntry(level: LogLevel, message: string, metadata?: LogMetadata): string {
    const timestamp = this.formatTimestamp()
    const levelUpper = level.toUpperCase().padEnd(5)

    // Merge child context with metadata
    const combinedMetadata = this.childContext ? { ...this.childContext, ...metadata } : metadata

    const metadataStr =
      combinedMetadata && Object.keys(combinedMetadata).length > 0
        ? ` ${JSON.stringify(combinedMetadata)}`
        : ''

    return `${timestamp} [${levelUpper}] ${message}${metadataStr}`
  }

  /**
   * Colorize log entry for console output.
   */
  private colorizeLogEntry(level: LogLevel, entry: string): string {
    if (!this.config.colorize) {
      return entry
    }

    const color = this.getLevelColor(level)
    return `${color}${entry}${Colors.reset}`
  }

  /**
   * Get color for log level.
   */
  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case 'debug':
        return Colors.gray
      case 'info':
        return Colors.blue
      case 'warn':
        return Colors.yellow
      case 'error':
        return Colors.red
      case 'fatal':
        return Colors.magenta
      default:
        return Colors.white
    }
  }

  /**
   * Write log entry using configured transport(s).
   */
  private writeLogEntry(level: LogLevel, message: string, metadata?: LogMetadata): void {
    const entry = this.formatLogEntry(level, message, metadata)

    // Always check log level before processing
    if (!this.shouldLog(level)) {
      return
    }

    switch (this.config.transport.type) {
      case 'console':
        this.writeToConsole(level, entry)
        break

      case 'file':
        this.writeToFile(entry)
        break

      case 'memory':
        this.writeToMemory(level, message, metadata)
        break
    }
  }

  /**
   * Check if message should be logged based on level.
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      fatal: 4,
    }

    const configLevel = this.config.level || 'info'
    return levels[level] >= levels[configLevel]
  }

  /**
   * Write to console (synchronous).
   */
  private writeToConsole(level: LogLevel, entry: string): void {
    const colorizedEntry = this.colorizeLogEntry(level, entry)

    if (level === 'error' || level === 'fatal') {
      // Use stderr for errors and fatal
      process.stderr.write(`${colorizedEntry}\n`)
    } else {
      // Use stdout for other levels
      process.stdout.write(`${colorizedEntry}\n`)
    }
  }

  /**
   * Write to file (synchronous).
   */
  private writeToFile(entry: string): void {
    if (!this.config.logFile) {
      throw new LoggingError('file-write', 'Log file path not configured')
    }

    try {
      const filePath = resolve(this.config.logFile)
      writeFileSync(filePath, `${entry}\n`, { flag: 'a', encoding: 'utf8' })
    } catch (error: any) {
      // Fallback to console on file write error
      console.error(`[LOGGER] Failed to write to file: ${error.message}`)
      console.error(`[LOGGER] ${entry}`)
    }
  }

  /**
   * Write to memory buffer (synchronous).
   */
  private writeToMemory(level: LogLevel, message: string, metadata?: LogMetadata): void {
    if (!this.memoryBuffer) {
      return
    }

    this.memoryBuffer.add({
      level,
      message,
      metadata: this.childContext ? { ...this.childContext, ...metadata } : metadata,
      timestamp: this.formatTimestamp(),
    })
  }

  /**
   * Log debug message.
   */
  async debug(message: string, metadata?: LogMetadata): Promise<void> {
    this.writeLogEntry('debug', message, metadata)
  }

  /**
   * Log info message.
   */
  async info(message: string, metadata?: LogMetadata): Promise<void> {
    this.writeLogEntry('info', message, metadata)
  }

  /**
   * Log warn message.
   */
  async warn(message: string, metadata?: LogMetadata): Promise<void> {
    this.writeLogEntry('warn', message, metadata)
  }

  /**
   * Log error message.
   */
  async error(message: string, metadata?: LogMetadata): Promise<void> {
    this.writeLogEntry('error', message, metadata)
  }

  /**
   * Create a child logger with persistent context.
   */
  child(context: LogContext): Logger {
    const mergedContext = this.childContext ? { ...this.childContext, ...context } : context

    return new SyncLoggerAdapter(this.config, mergedContext)
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
   * Get logger configuration.
   */
  getConfig(): SyncLoggerConfig {
    return { ...this.config }
  }

  /**
   * Update logger level dynamically.
   */
  setLevel(level: LogLevel): void {
    this.config.level = level
  }
}

/**
 * Create development-optimized synchronous logger.
 */
export function createDevelopmentSyncLogger(overrides?: Partial<SyncLoggerConfig>): Logger {
  const config: SyncLoggerConfig = {
    level: 'debug',
    environment: 'development',
    transportType: 'console',
    transport: { type: 'console' },
    colorize: true,
    timestampFormat: 'locale',
    ...overrides,
  }

  return new SyncLoggerAdapter(config)
}

/**
 * Create production-optimized synchronous logger.
 */
export function createProductionSyncLogger(
  logPath: string,
  overrides?: Partial<SyncLoggerConfig>
): Logger {
  const config: SyncLoggerConfig = {
    level: 'info',
    environment: 'production',
    transportType: 'file',
    logFile: logPath,
    transport: { type: 'file' },
    colorize: false,
    timestampFormat: 'iso',
    ...overrides,
  }

  return new SyncLoggerAdapter(config)
}

/**
 * Create test-optimized synchronous logger.
 */
export function createTestSyncLogger(overrides?: Partial<SyncLoggerConfig>): Logger {
  const config: SyncLoggerConfig = {
    level: 'error',
    environment: 'testing',
    transportType: 'memory',
    transport: { type: 'memory' },
    colorize: false,
    timestampFormat: 'iso',
    ...overrides,
  }

  return new SyncLoggerAdapter(config)
}
