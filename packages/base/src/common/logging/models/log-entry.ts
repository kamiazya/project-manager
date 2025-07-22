/**
 * Log Entry domain model for structured log data representation.
 *
 * This model represents a single log entry with all associated metadata,
 * providing type safety and business logic for log data manipulation.
 */

import { ValidationError } from '../../errors/base-errors.ts'
import type { LogLevel } from '../types/log-level.ts'
import type { LogMetadata } from '../types/log-metadata.ts'

/**
 * Core log entry interface representing a single log record.
 */
export interface LogEntry {
  /** Unique identifier for this log entry */
  id: string

  /** Timestamp when the log entry was created */
  timestamp: Date

  /** Log level indicating severity */
  level: LogLevel

  /** Human-readable log message */
  message: string

  /** Structured metadata associated with this log entry */
  metadata?: LogMetadata

  /** Optional formatted representation for display */
  formatted?: string

  /** Optional serialized representation for storage */
  serialized?: string

  /** Optional correlation with trace context */
  traceContext?: TraceInfo
}

/**
 * Trace information embedded in log entries.
 */
export interface TraceInfo {
  /** Trace identifier */
  traceId: string

  /** Span identifier for this operation */
  spanId?: string

  /** Parent span identifier */
  parentSpanId?: string

  /** Whether this trace is sampled */
  sampled?: boolean
}

/**
 * Log entry creation parameters.
 */
export interface CreateLogEntryParams {
  /** Log level */
  level: LogLevel

  /** Log message */
  message: string

  /** Optional metadata */
  metadata?: LogMetadata

  /** Optional custom timestamp (defaults to current time) */
  timestamp?: Date

  /** Optional custom ID (auto-generated if not provided) */
  id?: string
}

/**
 * Log entry formatting options.
 */
export interface LogEntryFormatOptions {
  /** Include timestamp in format */
  includeTimestamp?: boolean

  /** Timestamp format */
  timestampFormat?: 'iso' | 'locale' | 'relative'

  /** Include log level in format */
  includeLevel?: boolean

  /** Include metadata in format */
  includeMetadata?: boolean

  /** Metadata fields to include (if includeMetadata is true) */
  metadataFields?: string[]

  /** Maximum message length */
  maxMessageLength?: number

  /** Whether to colorize output */
  colorize?: boolean
}

/**
 * Log entry serialization options.
 */
export interface LogEntrySerializationOptions {
  /** Include all metadata fields */
  includeAllMetadata?: boolean

  /** Specific metadata fields to include */
  metadataFields?: string[]

  /** Whether to flatten nested metadata */
  flattenMetadata?: boolean

  /** Exclude sensitive fields */
  excludeSensitive?: boolean

  /** Custom field transformations */
  transforms?: Record<string, (value: unknown) => unknown>
}

/**
 * Log entry domain model with business logic.
 */
export class LogEntryModel implements LogEntry {
  readonly id: string
  readonly timestamp: Date
  readonly level: LogLevel
  readonly message: string
  readonly metadata?: LogMetadata

  private _formatted?: string
  private _serialized?: string

  constructor(params: CreateLogEntryParams) {
    this.id = params.id || LogEntryModel.generateId()
    this.timestamp = params.timestamp || new Date()
    this.level = params.level
    this.message = params.message
    this.metadata = params.metadata

    // Validate required fields
    this.validate()
  }

  /**
   * Get formatted representation of the log entry.
   */
  get formatted(): string {
    if (!this._formatted) {
      this._formatted = this.format()
    }
    return this._formatted
  }

  /**
   * Get serialized representation of the log entry.
   */
  get serialized(): string {
    if (!this._serialized) {
      this._serialized = this.serialize()
    }
    return this._serialized
  }

  /**
   * Get trace context if available.
   */
  get traceContext(): TraceInfo | undefined {
    if (!this.metadata?.traceId) return undefined

    return {
      traceId: this.metadata.traceId,
      spanId: this.metadata.spanId as string,
      parentSpanId: this.metadata.parentSpanId as string,
      sampled: this.metadata.sampled as boolean,
    }
  }

  /**
   * Create a new log entry from parameters.
   */
  static create(params: CreateLogEntryParams): LogEntryModel {
    return new LogEntryModel(params)
  }

  /**
   * Create a log entry from a plain object.
   */
  static fromObject(obj: Partial<LogEntry>): LogEntryModel {
    return new LogEntryModel({
      id: obj.id,
      level: obj.level || 'info',
      message: obj.message || '',
      metadata: obj.metadata,
      timestamp: obj.timestamp,
    })
  }

  /**
   * Generate a unique log entry ID.
   */
  static generateId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `log-${timestamp}-${random}`
  }

  /**
   * Validate log entry data.
   */
  private validate(): void {
    if (!this.id) {
      throw new ValidationError('id', undefined, 'Log entry ID is required')
    }

    if (!this.timestamp) {
      throw new ValidationError('timestamp', undefined, 'Log entry timestamp is required')
    }

    if (!this.level) {
      throw new ValidationError('level', undefined, 'Log entry level is required')
    }

    if (!['debug', 'info', 'warn', 'error', 'fatal'].includes(this.level)) {
      throw new ValidationError('level', this.level, `Invalid log level: ${this.level}`)
    }

    if (this.message === null || this.message === undefined) {
      throw new ValidationError('message', undefined, 'Log entry message is required')
    }

    if (typeof this.message !== 'string') {
      throw new ValidationError('message', this.message, 'Log entry message must be a string')
    }
  }

  /**
   * Format the log entry for human-readable display.
   */
  format(options: LogEntryFormatOptions = {}): string {
    const {
      includeTimestamp = true,
      timestampFormat = 'iso',
      includeLevel = true,
      includeMetadata = false,
      metadataFields,
      maxMessageLength,
      colorize = false,
    } = options

    let formatted = ''

    // Add timestamp
    if (includeTimestamp) {
      let timestampStr: string
      switch (timestampFormat) {
        case 'locale':
          timestampStr = this.timestamp.toLocaleString()
          break
        case 'relative':
          timestampStr = this.getRelativeTime()
          break
        default:
          timestampStr = this.timestamp.toISOString()
      }
      formatted += `[${timestampStr}] `
    }

    // Add log level
    if (includeLevel) {
      const levelStr = this.level.toUpperCase()
      if (colorize) {
        formatted += this.colorizeLevel(levelStr) + ': '
      } else {
        formatted += levelStr + ': '
      }
    }

    // Add message
    let message = this.message
    if (maxMessageLength && message.length > maxMessageLength) {
      message = message.substring(0, maxMessageLength - 3) + '...'
    }
    formatted += message

    // Add metadata
    if (includeMetadata && this.metadata) {
      const metadataToShow = metadataFields
        ? this.filterMetadata(this.metadata, metadataFields)
        : this.metadata

      if (Object.keys(metadataToShow).length > 0) {
        formatted += ' ' + JSON.stringify(metadataToShow)
      }
    }

    return formatted
  }

  /**
   * Serialize the log entry for storage.
   */
  serialize(options: LogEntrySerializationOptions = {}): string {
    const {
      includeAllMetadata = true,
      metadataFields,
      flattenMetadata = false,
      excludeSensitive = true,
      transforms = {},
    } = options

    const serializable: any = {
      id: this.id,
      timestamp: this.timestamp.toISOString(),
      level: this.level,
      message: this.message,
    }

    // Handle metadata
    if (this.metadata) {
      let metadata = { ...this.metadata }

      // Filter metadata fields
      if (!includeAllMetadata && metadataFields) {
        metadata = this.filterMetadata(metadata, metadataFields)
      }

      // Exclude sensitive data
      if (excludeSensitive) {
        metadata = this.sanitizeMetadata(metadata)
      }

      // Apply transforms
      for (const [field, transform] of Object.entries(transforms)) {
        if (field in metadata) {
          metadata[field] = transform(metadata[field])
        }
      }

      // Flatten metadata if requested
      if (flattenMetadata) {
        Object.assign(serializable, this.flattenObject(metadata))
      } else {
        serializable.metadata = metadata
      }
    }

    return JSON.stringify(serializable)
  }

  /**
   * Convert to plain object.
   */
  toObject(): LogEntry {
    return {
      id: this.id,
      timestamp: this.timestamp,
      level: this.level,
      message: this.message,
      metadata: this.metadata,
      formatted: this._formatted,
      serialized: this._serialized,
      traceContext: this.traceContext,
    }
  }

  /**
   * Clone the log entry with optional modifications.
   */
  clone(modifications: Partial<CreateLogEntryParams> = {}): LogEntryModel {
    return new LogEntryModel({
      id: modifications.id || this.id,
      timestamp: modifications.timestamp || this.timestamp,
      level: modifications.level || this.level,
      message: modifications.message || this.message,
      metadata: modifications.metadata || this.metadata,
    })
  }

  /**
   * Check if this log entry matches a filter.
   */
  matches(filter: LogEntryFilter): boolean {
    // Check level
    if (filter.level && !filter.level.includes(this.level)) {
      return false
    }

    // Check message
    if (filter.messagePattern) {
      const pattern = new RegExp(filter.messagePattern, 'i')
      if (!pattern.test(this.message)) {
        return false
      }
    }

    // Check metadata
    if (filter.metadata) {
      if (!this.metadata) return false

      for (const [key, value] of Object.entries(filter.metadata)) {
        if (this.metadata[key] !== value) {
          return false
        }
      }
    }

    // Check time range
    if (filter.timeRange) {
      const timestamp = this.timestamp.getTime()
      if (filter.timeRange.start && timestamp < filter.timeRange.start.getTime()) {
        return false
      }
      if (filter.timeRange.end && timestamp > filter.timeRange.end.getTime()) {
        return false
      }
    }

    return true
  }

  /**
   * Get relative time string.
   */
  private getRelativeTime(): string {
    const now = Date.now()
    const diff = now - this.timestamp.getTime()

    if (diff < 1000) return 'just now'
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`

    return `${Math.floor(diff / 86400000)}d ago`
  }

  /**
   * Colorize log level for console output.
   */
  private colorizeLevel(level: string): string {
    const colors: Record<string, string> = {
      DEBUG: '\x1b[90m', // Gray
      INFO: '\x1b[32m', // Green
      WARN: '\x1b[33m', // Yellow
      ERROR: '\x1b[31m', // Red
      FATAL: '\x1b[35m', // Magenta
    }

    const reset = '\x1b[0m'
    const color = colors[level] || ''

    return `${color}${level}${reset}`
  }

  /**
   * Filter metadata to include only specified fields.
   */
  private filterMetadata(metadata: LogMetadata, fields: string[]): LogMetadata {
    const filtered: LogMetadata = {}

    for (const field of fields) {
      if (field in metadata) {
        filtered[field] = metadata[field]
      }
    }

    return filtered
  }

  /**
   * Sanitize metadata by removing sensitive information.
   */
  private sanitizeMetadata(metadata: LogMetadata): LogMetadata {
    const sanitized = { ...metadata }
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'credential']

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***'
      }
    }

    return sanitized
  }

  /**
   * Flatten nested objects into dot notation.
   */
  private flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
    const flattened: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key

      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        Object.assign(flattened, this.flattenObject(value as Record<string, unknown>, newKey))
      } else {
        flattened[newKey] = value
      }
    }

    return flattened
  }
}

/**
 * Filter interface for log entry queries.
 */
export interface LogEntryFilter {
  /** Filter by log levels */
  level?: LogLevel[]

  /** Filter by message pattern (regex) */
  messagePattern?: string

  /** Filter by metadata fields */
  metadata?: Record<string, unknown>

  /** Filter by time range */
  timeRange?: {
    start?: Date
    end?: Date
  }

  /** Filter by trace ID */
  traceId?: string

  /** Filter by component */
  component?: string

  /** Filter by operation */
  operation?: string
}

/**
 * Utility functions for working with log entries.
 */
export const LogEntryUtils = {
  /**
   * Parse log entry from JSON string.
   */
  parseFromJson(json: string): LogEntryModel {
    try {
      const parsed = JSON.parse(json)
      return LogEntryModel.fromObject({
        ...parsed,
        timestamp: new Date(parsed.timestamp),
      })
    } catch (error) {
      throw new ValidationError('json', json, `Failed to parse log entry from JSON: ${error}`)
    }
  },

  /**
   * Batch create multiple log entries.
   */
  createBatch(entries: CreateLogEntryParams[]): LogEntryModel[] {
    return entries.map(params => LogEntryModel.create(params))
  },

  /**
   * Sort log entries by timestamp.
   */
  sortByTimestamp(entries: LogEntryModel[], ascending = false): LogEntryModel[] {
    return entries.sort((a, b) => {
      const diff = a.timestamp.getTime() - b.timestamp.getTime()
      return ascending ? diff : -diff
    })
  },

  /**
   * Group log entries by a field.
   */
  groupBy(
    entries: LogEntryModel[],
    field: keyof LogEntry | string
  ): Record<string, LogEntryModel[]> {
    const groups: Record<string, LogEntryModel[]> = {}

    for (const entry of entries) {
      let value: string

      if (field in entry) {
        value = String((entry as any)[field])
      } else if (entry.metadata && field in entry.metadata) {
        value = String(entry.metadata[field])
      } else {
        value = 'unknown'
      }

      if (!groups[value]) {
        groups[value] = []
      }
      groups[value]!.push(entry)
    }

    return groups
  },
} as const
