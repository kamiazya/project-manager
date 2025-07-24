/**
 * Synchronous Logger Infrastructure Implementation
 *
 * Simple synchronous logger adapter that ensures immediate process termination.
 * Uses fs.writeFileSync and console.log for immediate, blocking I/O operations.
 */

import { existsSync, mkdirSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, resolve } from 'node:path'
import { LoggingError } from '@project-manager/application'
import type {
  LogConfig,
  LogContext,
  Logger,
  LogLevel,
  LogMetadata,
} from '@project-manager/base/common/logging'

/**
 * Log rotation configuration for file transport.
 */
export interface SyncRotationConfig {
  /** Enable log rotation (default: true for file transport) */
  enabled?: boolean

  /** Maximum file size before rotation in bytes (default: 10MB) */
  maxSize?: number

  /** Maximum number of rotated files to keep (default: 5) */
  maxFiles?: number

  /** Pattern for rotated file names (default: logs rotation) */
  pattern?: string
}

/**
 * Default rotation configuration for file transport.
 */
export const DEFAULT_ROTATION_CONFIG: Required<Omit<SyncRotationConfig, 'pattern'>> = {
  enabled: true,
  maxSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
} as const

/**
 * Sync-specific configuration options.
 */
export interface SyncLoggerConfig extends LogConfig {
  /** Enable colorized console output */
  colorize?: boolean

  /** Custom timestamp format */
  timestampFormat?: 'iso' | 'locale' | 'epoch'

  /** Log rotation configuration (only for file transport) */
  rotation?: SyncRotationConfig
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
    // Apply default rotation config for file transport
    if (config.transportType === 'file') {
      this.config = {
        ...config,
        rotation: {
          ...DEFAULT_ROTATION_CONFIG,
          ...config.rotation, // User overrides take precedence
        },
      }
    } else {
      this.config = config
    }

    this.childContext = childContext

    // Initialize memory buffer if using memory transport
    if (config.transportType === 'memory') {
      this.memoryBuffer = new SyncMemoryBuffer()
    }

    // Ensure log directory exists for file transport
    if (config.transportType === 'file') {
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

    switch (this.config.transportType) {
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
   * Write to file (synchronous) with rotation support.
   */
  private writeToFile(entry: string): void {
    if (!this.config.logFile) {
      throw new LoggingError('file-write', 'Log file path not configured')
    }

    try {
      const filePath = resolve(this.config.logFile)

      // Ensure directory exists
      const dir = dirname(filePath)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }

      // Check if rotation is needed before writing
      if (this.config.rotation?.enabled) {
        this.checkAndRotateFile(filePath)
      }

      writeFileSync(filePath, `${entry}\n`, { flag: 'a', encoding: 'utf8' })
    } catch (error: any) {
      // Fallback to console on file write error
      console.error(`[LOGGER] Failed to write to file: ${error.message}`)
      console.error(`[LOGGER] ${entry}`)
    }
  }

  /**
   * Check if file needs rotation and perform it synchronously.
   */
  private checkAndRotateFile(filePath: string): void {
    if (!this.config.rotation?.enabled) {
      return
    }

    try {
      // Check if file exists and its size
      if (!existsSync(filePath)) {
        return
      }

      const stats = statSync(filePath)
      const maxSize = this.config.rotation?.maxSize || DEFAULT_ROTATION_CONFIG.maxSize

      if (stats.size >= maxSize) {
        this.rotateFile(filePath)
      }
    } catch (error: any) {
      // Log rotation error but don't stop logging
      console.error(`[LOGGER] Rotation check failed: ${error.message}`)
    }
  }

  /**
   * Rotate log file synchronously.
   */
  private rotateFile(filePath: string): void {
    const maxFiles = this.config.rotation?.maxFiles || DEFAULT_ROTATION_CONFIG.maxFiles
    const ext = extname(filePath)
    const baseName = basename(filePath, ext)
    const dir = dirname(filePath)

    try {
      // Rotate existing numbered files (move .3 to .4, .2 to .3, etc.)
      for (let i = maxFiles - 1; i > 0; i--) {
        const currentFile = resolve(dir, `${baseName}.${i}${ext}`)
        const nextFile = resolve(dir, `${baseName}.${i + 1}${ext}`)

        if (existsSync(currentFile)) {
          if (i === maxFiles - 1) {
            // Delete the oldest file
            unlinkSync(currentFile)
          } else {
            renameSync(currentFile, nextFile)
          }
        }
      }

      // Move current log file to .1
      const rotatedFile = resolve(dir, `${baseName}.1${ext}`)
      if (existsSync(filePath)) {
        renameSync(filePath, rotatedFile)
      }
    } catch (error: any) {
      console.error(`[LOGGER] File rotation failed: ${error.message}`)
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
  debug(message: string, metadata?: LogMetadata): void {
    this.writeLogEntry('debug', message, metadata)
  }

  /**
   * Log info message.
   */
  info(message: string, metadata?: LogMetadata): void {
    this.writeLogEntry('info', message, metadata)
  }

  /**
   * Log warn message.
   */
  warn(message: string, metadata?: LogMetadata): void {
    this.writeLogEntry('warn', message, metadata)
  }

  /**
   * Log error message.
   */
  error(message: string, metadata?: LogMetadata): void {
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
    colorize: false,
    timestampFormat: 'iso',
    // rotation will be applied automatically with defaults by constructor
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
    colorize: false,
    timestampFormat: 'iso',
    ...overrides,
  }

  return new SyncLoggerAdapter(config)
}
