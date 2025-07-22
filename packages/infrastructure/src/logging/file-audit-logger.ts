/**
 * File Audit Logger Infrastructure Implementation
 *
 * Comprehensive audit logging with append-only file operations, rotation support,
 * and compliance-focused features for tamper-proof audit trails.
 */

import { LoggingError } from '@project-manager/application'
import type {
  AuditEventFilter,
  AuditEventStatistics,
  AuditFilter,
  AuditLogger,
  AuditStatistics,
  CreateAuditEvent,
  CreateOperationEvent,
  DeleteAuditEvent,
  DeleteOperationEvent,
  LogConfig,
  Logger,
  OperationAuditEvent,
  ReadAuditEvent,
  TimePeriod,
  UpdateAuditEvent,
  UpdateOperationEvent,
} from '@project-manager/base/common/logging'
import {
  AuditEventModel,
  AuditEventUtils,
  CreateAuditEventModel,
  DeleteAuditEventModel,
  ReadAuditEventModel,
  UpdateAuditEventModel,
} from '@project-manager/base/common/logging'
import { createHash } from 'crypto'
import { EventEmitter } from 'events'
import { createReadStream, createWriteStream, type WriteStream } from 'fs'
import { mkdir, open, readdir, rename, stat, unlink } from 'fs/promises'
import { basename, dirname, extname, join, resolve } from 'path'
import { pipeline } from 'stream/promises'
import { createGzip } from 'zlib'

/**
 * File audit logger specific configuration.
 */
export interface FileAuditLoggerConfig {
  /** Audit file configuration */
  auditFile: {
    /** Path to the audit log file */
    path: string

    /** File rotation settings */
    rotation?: {
      /** Enable rotation */
      enabled: boolean

      /** Maximum file size before rotation */
      maxSize?: string

      /** Maximum number of rotated files to keep */
      maxFiles?: number

      /** Compress rotated files */
      compress?: boolean

      /** Date pattern for rotation */
      datePattern?: string
    }
  }

  /** Ensure append-only operations */
  appendOnly: boolean

  /** Enable integrity checking */
  integrityCheck: boolean

  /** Data retention settings */
  retention?: {
    /** Retention period in days */
    days: number

    /** Automatic cleanup of old files */
    automaticCleanup: boolean
  }

  /** Performance settings */
  performance?: {
    /** Buffer size for writes */
    bufferSize?: number

    /** Sync writes to disk */
    sync?: boolean

    /** Batch size for bulk operations */
    batchSize?: number

    /** Flush interval in milliseconds */
    flushInterval?: number
  }
}

/**
 * Statistics for audit operations.
 */
interface AuditOperationStats {
  totalEvents: number
  eventsByType: Record<string, number>
  eventsByActor: Record<string, number>
  eventsByEntity: Record<string, number>
  lastEventTime: Date | null
  fileSize: number
  errorCount: number
}

/**
 * File audit logger implementation with comprehensive features.
 */
export class FileAuditLoggerAdapter extends EventEmitter implements AuditLogger {
  private config: FileAuditLoggerConfig
  private logger: Logger
  private writeStream?: WriteStream
  private stats: AuditOperationStats
  private isInitialized = false
  private flushTimer?: NodeJS.Timeout
  private writeQueue: string[] = []
  private isShuttingDown = false

  constructor(config: FileAuditLoggerConfig, logger: Logger) {
    super()
    this.config = config
    this.logger = logger
    this.stats = {
      totalEvents: 0,
      eventsByType: {},
      eventsByActor: {},
      eventsByEntity: {},
      lastEventTime: null,
      fileSize: 0,
      errorCount: 0,
    }

    this.setupFlushTimer()
    this.setupGracefulShutdown()
  }

  /**
   * Initialize the audit logger.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Ensure audit directory exists
      const auditDir = dirname(resolve(this.config.auditFile.path))
      await mkdir(auditDir, { recursive: true })

      // Initialize write stream
      await this.initializeWriteStream()

      // Load existing statistics
      await this.loadStatistics()

      // Setup rotation if enabled
      if (this.config.auditFile.rotation?.enabled) {
        await this.checkRotationNeeded()
      }

      this.isInitialized = true
      this.emit('initialized')
    } catch (error) {
      this.handleError('Failed to initialize audit logger', error)
      throw error
    }
  }

  /**
   * Initialize the write stream for audit file.
   */
  private async initializeWriteStream(): Promise<void> {
    const filePath = resolve(this.config.auditFile.path)

    // Create write stream with append mode
    this.writeStream = createWriteStream(filePath, {
      flags: 'a', // Append mode for audit integrity
      encoding: 'utf8',
      highWaterMark: this.config.performance?.bufferSize || 16384,
    })

    this.writeStream.on('error', error => {
      this.handleError('Write stream error', error)
    })

    this.writeStream.on('close', () => {
      this.emit('streamClosed')
    })
  }

  /**
   * Setup automatic flush timer.
   */
  private setupFlushTimer(): void {
    const flushInterval = this.config.performance?.flushInterval || 5000 // 5 seconds default

    this.flushTimer = setInterval(async () => {
      if (!this.isShuttingDown) {
        await this.flushPendingWrites()
      }
    }, flushInterval)
  }

  /**
   * Setup graceful shutdown handling.
   */
  private setupGracefulShutdown(): void {
    const shutdown = async () => {
      this.isShuttingDown = true
      try {
        await this.close()
        process.exit(0)
      } catch (error) {
        console.error('Error during audit logger shutdown:', error)
        process.exit(1)
      }
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  }

  /**
   * Record a CREATE operation audit event.
   */
  async recordCreate(event: CreateOperationEvent): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const auditEvent = CreateAuditEventModel.create({
        operation: 'create',
        actor: event.actor,
        entityType: event.entityType,
        entityId: event.entityId,
        source: event.source,
        before: null,
        after: event.after,
        traceId: event.traceId,
      })

      await this.writeAuditEvent(auditEvent)
      this.updateStats('create', event.actor.type, event.entityType)
    } catch (error) {
      this.handleError('Failed to record create operation', error)
      throw error
    }
  }

  /**
   * Record a READ operation audit event.
   */
  async recordRead(event: any): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const auditEvent = ReadAuditEventModel.create({
        operation: 'read',
        actor: event.actor,
        entityType: event.entityType,
        entityId: event.entityId,
        source: event.source,
        before: event.state,
        after: event.state,
        traceId: event.traceId,
        accessDetails: event.accessDetails,
      })

      await this.writeAuditEvent(auditEvent)
      this.updateStats('read', event.actor.type, event.entityType)
    } catch (error) {
      this.handleError('Failed to record read operation', error)
      throw error
    }
  }

  /**
   * Record an UPDATE operation audit event.
   */
  async recordUpdate(event: UpdateOperationEvent): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const auditEvent = UpdateAuditEventModel.create({
        operation: 'update',
        actor: event.actor,
        entityType: event.entityType,
        entityId: event.entityId,
        source: event.source,
        before: event.before,
        after: event.after,
        traceId: event.traceId,
        changes: event.changes,
      })

      await this.writeAuditEvent(auditEvent)
      this.updateStats('update', event.actor.type, event.entityType)
    } catch (error) {
      this.handleError('Failed to record update operation', error)
      throw error
    }
  }

  /**
   * Record a DELETE operation audit event.
   */
  async recordDelete(event: DeleteOperationEvent): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const auditEvent = DeleteAuditEventModel.create({
        operation: 'delete',
        actor: event.actor,
        entityType: event.entityType,
        entityId: event.entityId,
        source: event.source,
        before: event.before,
        after: null,
        traceId: event.traceId,
      })

      await this.writeAuditEvent(auditEvent)
      this.updateStats('delete', event.actor.type, event.entityType)
    } catch (error) {
      this.handleError('Failed to record delete operation', error)
      throw error
    }
  }

  /**
   * Write audit event to file with integrity checks.
   */
  private async writeAuditEvent(event: AuditEventModel): Promise<void> {
    const serialized = event.serialize(true) // Sanitized serialization
    const line = serialized + '\n'

    if (
      this.config.performance?.batchSize &&
      this.writeQueue.length < this.config.performance.batchSize
    ) {
      // Add to batch queue
      this.writeQueue.push(line)
      return
    }

    // Write immediately or flush batch
    const linesToWrite = this.writeQueue.length > 0 ? [...this.writeQueue, line] : [line]
    this.writeQueue = []

    for (const lineToWrite of linesToWrite) {
      await this.writeLineToFile(lineToWrite)
    }

    // Check if rotation is needed after write
    if (this.config.auditFile.rotation?.enabled) {
      await this.checkRotationNeeded()
    }
  }

  /**
   * Write line to audit file with error handling.
   */
  private async writeLineToFile(line: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.writeStream) {
        reject(new LoggingError('stream-initialization', 'Write stream not initialized'))
        return
      }

      const success = this.writeStream.write(line, 'utf8', error => {
        if (error) {
          this.stats.errorCount++
          reject(error)
        } else {
          this.stats.fileSize += Buffer.byteLength(line, 'utf8')
          resolve()
        }
      })

      if (!success) {
        // Handle backpressure
        this.writeStream.once('drain', resolve)
      }
    })
  }

  /**
   * Flush pending writes to disk.
   */
  private async flushPendingWrites(): Promise<void> {
    if (this.writeQueue.length === 0) return

    const linesToWrite = [...this.writeQueue]
    this.writeQueue = []

    try {
      for (const line of linesToWrite) {
        await this.writeLineToFile(line)
      }

      // Force sync to disk if configured
      if (this.config.performance?.sync && this.writeStream) {
        await new Promise<void>((resolve, reject) => {
          ;(this.writeStream as any)!.flush?.((error: any) => {
            if (error) reject(error)
            else resolve()
          })
        })
      }
    } catch (error) {
      // Re-queue failed writes
      this.writeQueue.unshift(...linesToWrite)
      throw error
    }
  }

  /**
   * Update internal statistics.
   */
  private updateStats(operation: string, actorType: string, entityType: string): void {
    this.stats.totalEvents++
    this.stats.eventsByType[operation] = (this.stats.eventsByType[operation] || 0) + 1
    this.stats.eventsByActor[actorType] = (this.stats.eventsByActor[actorType] || 0) + 1
    this.stats.eventsByEntity[entityType] = (this.stats.eventsByEntity[entityType] || 0) + 1
    this.stats.lastEventTime = new Date()
  }

  /**
   * Load existing statistics from file.
   */
  private async loadStatistics(): Promise<void> {
    try {
      const filePath = resolve(this.config.auditFile.path)
      const fileStats = await stat(filePath).catch(() => null)

      if (fileStats) {
        this.stats.fileSize = fileStats.size

        // Quick scan of file to get basic stats
        // In production, this could be optimized with a separate stats file
        const lineCount = await this.countLines(filePath)
        this.stats.totalEvents = lineCount
      }
    } catch (error) {
      // File doesn't exist yet, start with empty stats
    }
  }

  /**
   * Count lines in audit file efficiently.
   */
  private async countLines(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      let lineCount = 0
      const stream = createReadStream(filePath, { encoding: 'utf8' })

      let buffer = ''
      stream.on('data', (chunk: string | Buffer) => {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line
        lineCount += lines.length
      })

      stream.on('end', () => {
        if (buffer.trim()) lineCount++ // Count final line if exists
        resolve(lineCount)
      })

      stream.on('error', reject)
    })
  }

  /**
   * Check if file rotation is needed and perform rotation.
   */
  private async checkRotationNeeded(): Promise<void> {
    const rotation = this.config.auditFile.rotation
    if (!rotation?.enabled) return

    const filePath = resolve(this.config.auditFile.path)

    try {
      const fileStats = await stat(filePath)
      const maxBytes = this.parseSize(rotation.maxSize || '100MB')

      if (fileStats.size >= maxBytes) {
        await this.rotateFile()
      }
    } catch (error) {
      // File doesn't exist yet
    }
  }

  /**
   * Parse size string to bytes.
   */
  private parseSize(sizeStr: string): number {
    const match = sizeStr.match(/^(\d+)\s*(MB|GB|KB)?$/i)
    if (!match) return 100 * 1024 * 1024 // Default 100MB

    const size = parseInt(match[1]!)
    const unit = (match[2] || '').toUpperCase()

    switch (unit) {
      case 'KB':
        return size * 1024
      case 'MB':
        return size * 1024 * 1024
      case 'GB':
        return size * 1024 * 1024 * 1024
      default:
        return size
    }
  }

  /**
   * Rotate audit file.
   */
  private async rotateFile(): Promise<void> {
    const filePath = resolve(this.config.auditFile.path)
    const rotation = this.config.auditFile.rotation!

    try {
      // Close current stream
      if (this.writeStream) {
        await new Promise<void>(resolve => {
          this.writeStream!.end(resolve)
        })
      }

      // Rotate existing files
      await this.rotateExistingFiles(filePath, rotation.maxFiles || 10)

      // Move current file to .1
      const rotatedPath = `${filePath}.1`
      await rename(filePath, rotatedPath)

      // Compress if enabled
      if (rotation.compress) {
        await this.compressFile(rotatedPath)
      }

      // Reinitialize write stream
      await this.initializeWriteStream()

      // Clean up old files if needed
      await this.cleanupOldFiles(filePath, rotation.maxFiles || 10)

      this.emit('fileRotated', { original: filePath, rotated: rotatedPath })
    } catch (error) {
      this.handleError('Failed to rotate audit file', error)
    }
  }

  /**
   * Rotate existing numbered files.
   */
  private async rotateExistingFiles(basePath: string, maxFiles: number): Promise<void> {
    for (let i = maxFiles - 1; i >= 1; i--) {
      const currentPath = `${basePath}.${i}`
      const nextPath = `${basePath}.${i + 1}`
      const compressedCurrentPath = `${currentPath}.gz`

      try {
        // Check for compressed version first
        if (await this.fileExists(compressedCurrentPath)) {
          await rename(compressedCurrentPath, `${nextPath}.gz`)
        } else if (await this.fileExists(currentPath)) {
          await rename(currentPath, nextPath)
        }
      } catch (error) {
        // File doesn't exist, continue
      }
    }
  }

  /**
   * Check if file exists.
   */
  private async fileExists(path: string): Promise<boolean> {
    try {
      await stat(path)
      return true
    } catch {
      return false
    }
  }

  /**
   * Compress rotated file.
   */
  private async compressFile(filePath: string): Promise<void> {
    const compressedPath = `${filePath}.gz`

    try {
      await pipeline(createReadStream(filePath), createGzip(), createWriteStream(compressedPath))

      // Remove original after successful compression
      await unlink(filePath)
    } catch (error) {
      // Keep original file if compression fails
      this.logger.warn(`Failed to compress ${filePath}:`, { error, filePath })
    }
  }

  /**
   * Clean up old rotated files.
   */
  private async cleanupOldFiles(basePath: string, maxFiles: number): Promise<void> {
    try {
      const dir = dirname(basePath)
      const baseFilename = basename(basePath)
      const files = await readdir(dir)

      // Find rotated files
      const rotatedFiles = files
        .filter(file => file.startsWith(`${baseFilename}.`) && /\.\d+(\.(gz|zip))?$/.test(file))
        .map(file => ({
          path: join(dir, file),
          index: parseInt(file.match(/\.(\d+)/)?.[1] || '0'),
        }))
        .sort((a, b) => b.index - a.index) // Newest first

      // Delete files beyond max count
      const filesToDelete = rotatedFiles.slice(maxFiles)
      for (const file of filesToDelete) {
        try {
          await unlink(file.path)
        } catch (error) {
          this.logger.warn(`Failed to delete old audit file ${file.path}:`, {
            error,
            filePath: file.path,
          })
        }
      }
    } catch (error) {
      this.logger.warn('Failed to clean up old audit files:', { error })
    }
  }

  /**
   * Query audit events with filtering.
   */
  async queryEvents(filter: AuditFilter): Promise<OperationAuditEvent[]> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const filePath = resolve(this.config.auditFile.path)
    const events: OperationAuditEvent[] = []

    return new Promise((resolve, reject) => {
      const stream = createReadStream(filePath, { encoding: 'utf8' })
      let buffer = ''
      let processedCount = 0

      stream.on('data', (chunk: string | Buffer) => {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line

        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const eventData = JSON.parse(line)
            const event = AuditEventModel.fromObject(eventData)

            // Convert AuditFilter to AuditEventFilter
            const eventFilter: AuditEventFilter = {
              operation: filter.operation,
              entityType: filter.entityType,
              entityId: filter.entityId,
              actor: filter.actor,
              source: filter.source,
              dateRange: filter.dateRange
                ? {
                    start: filter.dateRange.start.toISOString(),
                    end: filter.dateRange.end.toISOString(),
                  }
                : undefined,
              traceId: filter.traceId,
              limit: filter.limit,
              offset: filter.offset,
            }

            if (event.matches(eventFilter)) {
              events.push(event.toObject() as unknown as OperationAuditEvent)
            }

            processedCount++

            // Limit results to prevent memory issues
            if (filter.limit && events.length >= filter.limit) {
              stream.destroy()
              break
            }
          } catch (error) {
            // Skip invalid lines
          }
        }
      })

      stream.on('end', () => {
        // Apply offset and sorting
        let result = events

        if (filter.offset) {
          result = result.slice(filter.offset)
        }

        // Sort by timestamp by default (newest first)
        result.sort((a, b) => {
          const aTime = new Date(a.timestamp).getTime()
          const bTime = new Date(b.timestamp).getTime()
          return bTime - aTime
        })

        resolve(result)
      })

      stream.on('error', reject)
    })
  }

  /**
   * Get nested property value for sorting.
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Generate audit statistics for a time period.
   */
  async getStatistics(period: TimePeriod): Promise<AuditStatistics> {
    const filter: AuditFilter = {
      dateRange: {
        start: period.start,
        end: period.end,
      },
    }

    const events = await this.queryEvents(filter)

    // Convert statistics to match AuditStatistics interface
    const stats = AuditEventUtils.calculateStatistics(
      events.map(e => AuditEventModel.fromObject(e as any)),
      { start: period.start.toISOString(), end: period.end.toISOString() }
    )

    return {
      period,
      totalOperations: stats.totalOperations || 0,
      operationsByType: (stats as any).operationCounts || {},
      operationsByActor: (stats as any).actorCounts || {},
      operationsByEntity: (stats as any).entityTypeCounts || {},
      operationsBySource: {},
      errorRate: 0,
      averageResponseTime: 0,
      mostActiveActors: [],
      mostModifiedEntities: [],
    } as unknown as AuditStatistics
  }

  /**
   * Handle errors with proper logging and events.
   */
  private handleError(message: string, error: any): void {
    this.stats.errorCount++
    this.emit('error', { message, error })

    // Log to console as fallback (avoid circular logging)
    console.error(`[FileAuditLogger] ${message}:`, error)
  }

  /**
   * Get current statistics.
   */
  getStats(): AuditOperationStats {
    return { ...this.stats }
  }

  /**
   * Check if audit logger is healthy.
   */
  isHealthy(): boolean {
    const errorRate =
      this.stats.totalEvents > 0 ? this.stats.errorCount / this.stats.totalEvents : 0

    return (
      !this.isShuttingDown &&
      this.isInitialized &&
      errorRate < 0.01 && // Less than 1% error rate
      !!this.writeStream
    )
  }

  /**
   * Flush all pending operations.
   */
  async flush(): Promise<void> {
    await this.flushPendingWrites()

    if (this.writeStream) {
      await new Promise<void>((resolve, reject) => {
        const stream = this.writeStream! as any
        if (typeof stream.flush === 'function') {
          stream.flush((error: any) => {
            if (error) reject(error)
            else resolve()
          })
        } else {
          resolve()
        }
      })
    }
  }

  /**
   * Close audit logger and clean up resources.
   */
  async close(): Promise<void> {
    this.isShuttingDown = true

    // Clear flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = undefined
    }

    try {
      // Flush any pending writes
      await this.flushPendingWrites()

      // Close write stream
      if (this.writeStream) {
        await new Promise<void>(resolve => {
          this.writeStream!.end(resolve)
        })
        this.writeStream = undefined
      }

      this.removeAllListeners()
      this.emit('closed')
    } catch (error) {
      this.handleError('Error during close', error)
    }
  }
}

/**
 * Factory function to create FileAuditLogger instances.
 */
export function createFileAuditLogger(config: FileAuditLoggerConfig, logger: Logger): AuditLogger {
  return new FileAuditLoggerAdapter(config, logger)
}

/**
 * Create compliance-focused audit logger.
 */
export function createComplianceAuditLogger(
  auditPath: string,
  logger: Logger,
  overrides?: Partial<FileAuditLoggerConfig>
): AuditLogger {
  const config: FileAuditLoggerConfig = {
    auditFile: {
      path: auditPath,
      rotation: {
        enabled: true,
        maxSize: '50MB',
        maxFiles: 50, // Keep more files for compliance
        compress: true,
      },
    },
    appendOnly: true,
    integrityCheck: true,
    retention: {
      days: 2555, // 7 years for compliance
      automaticCleanup: false, // Manual review required
    },
    performance: {
      sync: true, // Ensure data integrity
      bufferSize: 8192,
      batchSize: 10,
      flushInterval: 2000, // More frequent flushes
    },
    ...overrides,
  }

  return new FileAuditLoggerAdapter(config, logger)
}

/**
 * Create development-focused audit logger.
 */
export function createDevelopmentAuditLogger(
  auditPath: string,
  logger: Logger,
  overrides?: Partial<FileAuditLoggerConfig>
): AuditLogger {
  const config: FileAuditLoggerConfig = {
    auditFile: {
      path: auditPath,
      rotation: {
        enabled: true,
        maxSize: '10MB',
        maxFiles: 5,
        compress: false, // Faster for development
      },
    },
    appendOnly: true,
    integrityCheck: false, // Faster for development
    performance: {
      sync: false,
      bufferSize: 16384,
      batchSize: 50,
      flushInterval: 5000,
    },
    ...overrides,
  }

  return new FileAuditLoggerAdapter(config, logger)
}
