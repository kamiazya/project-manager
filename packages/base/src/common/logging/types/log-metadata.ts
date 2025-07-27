/**
 * Log metadata type definitions for structured logging.
 *
 * Provides comprehensive type safety and structure for contextual information
 * that accompanies log messages across all architectural layers.
 */

/**
 * Core metadata interface for all log entries.
 * Provides essential context that should be included with log messages.
 */
export interface LogMetadata {
  // Core identification fields
  /** Unique identifier for tracing requests across system boundaries */
  traceId?: string

  /** Session identifier for user interactions */
  sessionId?: string

  /** Request identifier for individual operations */
  requestId?: string

  // Operation context
  /** Specific operation being performed (e.g., 'ticket.create', 'user.authenticate') */
  operation?: string

  /** Type of operation being performed */
  operationType?: OperationType

  /** User identifier performing the operation */
  userId?: string

  // AI context (for AI-assisted operations)
  /** AI agent identifier when operation involves AI assistance */
  aiAgent?: string

  /** Human co-author for AI operations */
  coAuthor?: string

  // Technical context
  /** Component or service generating the log */
  component?: string

  /** Architectural layer where the log originated */
  layer?: ArchitectureLayer

  // Performance metrics
  /** Start time for performance measurement (timestamp) */
  startTime?: number

  /** Duration in milliseconds for completed operations */
  duration?: number

  // Business context
  /** Type of entity being operated on */
  entityType?: string

  /** Unique identifier of the entity */
  entityId?: string

  // Error context (when logging errors)
  /** Error name/type */
  errorName?: string

  /** Error code or identifier */
  errorCode?: string

  /** Error stack trace */
  stack?: string

  // System context
  /** Process ID generating the log */
  processId?: number

  /** Hostname of the system */
  hostname?: string

  /** Application version */
  version?: string

  // Custom metadata - allows any additional fields
  /** Any additional contextual data */
  [key: string]: unknown
}

/**
 * Extended metadata for performance monitoring.
 */
export interface PerformanceMetadata extends LogMetadata {
  /** CPU usage at time of log */
  cpuUsage?: number

  /** Memory usage in bytes */
  memoryUsage?: number

  /** Database query time in milliseconds */
  dbQueryTime?: number

  /** External API call time in milliseconds */
  apiCallTime?: number

  /** Cache hit/miss information */
  cacheHit?: boolean

  /** Number of database queries performed */
  dbQueries?: number

  /** Size of response payload in bytes */
  responseSize?: number
}

/**
 * Operation type enumeration for categorizing logged operations.
 */
export type OperationType =
  | 'create' // Creating new entities
  | 'read' // Reading/querying entities
  | 'update' // Modifying existing entities
  | 'delete' // Removing entities
  | 'search' // Searching/filtering entities
  | 'sync' // Synchronizing with external systems
  | 'auth' // Authentication operations
  | 'config' // Configuration operations
  | 'health' // Health check operations
  | 'cache' // Cache operations
  | 'batch' // Batch processing operations
  | 'export' // Export operations
  | 'import' // Import operations

/**
 * Architecture layer enumeration for identifying log origin.
 */
export type ArchitectureLayer =
  | 'domain' // Domain layer (entities, value objects)
  | 'application' // Application layer (use cases)
  | 'infrastructure' // Infrastructure layer (repositories, adapters)
  | 'sdk' // SDK layer (facades)
  | 'cli' // CLI application
  | 'mcp' // MCP server application

/**
 * Context interface for child logger creation.
 * Defines persistent context that will be added to all log entries from a child logger.
 */
export interface LogContext {
  /** Component or service name */
  component?: string

  /** Architectural layer */
  layer?: ArchitectureLayer

  /** Operation being performed */
  operation?: string

  /** Trace identifier */
  traceId?: string

  /** User identifier */
  userId?: string

  /** Session identifier */
  sessionId?: string

  /** Any additional persistent context */
  [key: string]: unknown
}

/**
 * Structured error information for error logs.
 */
export interface ErrorMetadata extends LogMetadata {
  /** Error instance information */
  error: {
    /** Error name/constructor name */
    name: string

    /** Error message */
    message: string

    /** Error stack trace */
    stack?: string

    /** Error code (if available) */
    code?: string | number

    /** Underlying cause (for wrapped errors) */
    cause?: unknown
  }

  /** Context when error occurred */
  errorContext?: {
    /** Input data that caused the error (sanitized) */
    input?: unknown

    /** System state when error occurred */
    state?: Record<string, unknown>

    /** Previous operations in the same trace */
    previousOperations?: string[]

    /** Recovery actions attempted */
    recoveryAttempts?: string[]
  }
}

/**
 * Metadata for audit-specific logs.
 */
export interface AuditMetadata extends LogMetadata {
  /** Actor performing the operation */
  actor: {
    type: 'human' | 'ai' | 'system'
    id: string
    name?: string
    coAuthor?: string
  }

  /** Before state of the entity */
  before?: Record<string, unknown>

  /** After state of the entity */
  after?: Record<string, unknown>

  /** Specific fields that changed */
  changes?: Array<{
    field: string
    oldValue: unknown
    newValue: unknown
  }>
}

/**
 * List of field names that might contain sensitive data.
 * Used for sanitizing log metadata to prevent sensitive information leakage.
 */
const SENSITIVE_FIELD_PATTERNS = ['password', 'token', 'apiKey', 'secret', 'credential'] as const

/**
 * Check if a field name indicates it might contain sensitive data.
 *
 * @param fieldName - The field name to check
 * @returns True if the field name matches sensitive patterns
 */
function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_FIELD_PATTERNS.some(pattern =>
    fieldName.toLowerCase().includes(pattern.toLowerCase())
  )
}

/**
 * Sanitize a single value based on its type and field sensitivity.
 *
 * @param key - The field name
 * @param value - The value to sanitize
 * @param sanitizeObject - Function to recursively sanitize nested objects
 * @returns Sanitized value or undefined if the field should be removed
 */
function sanitizeValue(
  key: string,
  value: unknown,
  sanitizeObject: (obj: Record<string, unknown>) => Record<string, unknown>
): unknown {
  if (isSensitiveField(key)) {
    // Only keep string sensitive fields as redacted, remove others
    return typeof value === 'string' ? '***REDACTED***' : undefined
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return sanitizeObject(value as Record<string, unknown>)
  }

  return value
}

/**
 * Utility functions for working with log metadata.
 */
export const LogMetadataUtils = {
  /**
   * Sanitize metadata by removing sensitive information.
   *
   * @param metadata - Original metadata
   * @returns Sanitized metadata
   */
  sanitize(metadata: LogMetadata): LogMetadata {
    const sanitized: LogMetadata = {}

    // Process each field using the shared sanitization logic
    for (const [key, value] of Object.entries(metadata)) {
      const sanitizedValue = sanitizeValue(key, value, this.sanitizeObject.bind(this))

      // Only include the field if it's not marked for removal
      if (sanitizedValue !== undefined) {
        sanitized[key] = sanitizedValue
      }
    }

    return sanitized
  },

  /**
   * Sanitize nested objects recursively.
   */
  sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {}

    // Process each field using the shared sanitization logic
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedValue = sanitizeValue(key, value, this.sanitizeObject.bind(this))

      // Only include the field if it's not marked for removal
      if (sanitizedValue !== undefined) {
        sanitized[key] = sanitizedValue
      }
    }

    return sanitized
  },

  /**
   * Merge multiple metadata objects with later ones taking precedence.
   *
   * @param metadataObjects - Metadata objects to merge
   * @returns Merged metadata
   */
  merge(...metadataObjects: (LogMetadata | undefined)[]): LogMetadata {
    const result: LogMetadata = {}

    for (const metadata of metadataObjects) {
      if (metadata) {
        Object.assign(result, metadata)
      }
    }

    return result
  },

  /**
   * Extract standard fields from metadata.
   *
   * @param metadata - Source metadata
   * @returns Object with only standard fields
   */
  extractStandardFields(metadata: LogMetadata): Partial<LogMetadata> {
    const standardFields: (keyof LogMetadata)[] = [
      'traceId',
      'sessionId',
      'requestId',
      'operation',
      'operationType',
      'userId',
      'aiAgent',
      'coAuthor',
      'component',
      'layer',
      'startTime',
      'duration',
      'entityType',
      'entityId',
    ]

    const result: Partial<LogMetadata> = {}

    for (const field of standardFields) {
      if (metadata[field] !== undefined) {
        result[field] = metadata[field]
      }
    }

    return result
  },

  /**
   * Extract custom fields from metadata (non-standard fields).
   *
   * @param metadata - Source metadata
   * @returns Object with only custom fields
   */
  extractCustomFields(metadata: LogMetadata): Record<string, unknown> {
    const standardFields = new Set([
      'traceId',
      'sessionId',
      'requestId',
      'operation',
      'operationType',
      'userId',
      'aiAgent',
      'coAuthor',
      'component',
      'layer',
      'startTime',
      'duration',
      'entityType',
      'entityId',
      'errorName',
      'errorCode',
      'stack',
      'processId',
      'hostname',
      'version',
    ])

    const result: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(metadata)) {
      if (!standardFields.has(key)) {
        result[key] = value
      }
    }

    return result
  },

  /**
   * Calculate metadata size for performance monitoring.
   *
   * @param metadata - Metadata to measure
   * @returns Approximate size in bytes
   */
  calculateSize(metadata: LogMetadata): number {
    return JSON.stringify(metadata).length
  },

  /**
   * Validate metadata structure for required fields in specific contexts.
   *
   * @param metadata - Metadata to validate
   * @param context - Validation context
   * @returns Array of validation errors (empty if valid)
   */
  validate(
    metadata: LogMetadata,
    context: 'audit' | 'performance' | 'error' | 'general' = 'general'
  ): string[] {
    const errors: string[] = []

    switch (context) {
      case 'audit':
        if (!metadata.traceId) errors.push('traceId is required for audit logs')
        if (!metadata.operation) errors.push('operation is required for audit logs')
        if (!metadata.entityType) errors.push('entityType is required for audit logs')
        break

      case 'performance':
        if (!metadata.operation) errors.push('operation is required for performance logs')
        if (metadata.startTime && metadata.duration == null) {
          errors.push('duration should be provided when startTime is present')
        }
        break

      case 'error':
        if (!metadata.operation) errors.push('operation is required for error logs')
        // Error-specific validations can be added here
        break

      case 'general':
        // General validation rules
        if (metadata.traceId && typeof metadata.traceId !== 'string') {
          errors.push('traceId must be a string')
        }
        if (metadata.duration && typeof metadata.duration !== 'number') {
          errors.push('duration must be a number')
        }
        break
    }

    return errors
  },
} as const
