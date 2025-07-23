/**
 * Audit Interceptor
 *
 * Handles automatic audit logging for AuditableUseCase executions.
 * Integrates with LoggingContextService to capture execution context and
 * generates comprehensive audit records for compliance and traceability.
 */

import type { AuditLogger, Logger } from '@project-manager/base/common/logging'
import type { AuditMetadata } from '../services/audit-metadata-generator.ts'
import type { IdGenerator } from '../services/id-generator.interface.ts'
import type { LoggingContextService } from '../services/logging-context.service.ts'

/**
 * Audit record data structure for UseCase execution.
 */
export interface UseCaseAuditRecord {
  /** Operation identifier */
  operation: string

  /** Entity type being operated on */
  entityType: string

  /** Specific entity ID (if available) */
  entityId?: string

  /** Actor performing the operation */
  actor: {
    type: 'human' | 'ai' | 'system'
    id: string
    name: string
    coAuthor?: string
  }

  /** Source of the operation */
  source: 'cli' | 'mcp' | 'api' | 'scheduler' | 'test'

  /** Trace ID for request correlation */
  traceId: string

  /** State before the operation (for updates/deletes) */
  before?: any

  /** State after the operation (for creates/updates) */
  after?: any

  /** Execution result information */
  execution: {
    success: boolean
    duration: number
    startTime: number
    endTime: number
    error?: {
      name: string
      message: string
      stack?: string
    }
  }

  /** Request metadata (sanitized) */
  request?: {
    type: string
    hasData: boolean
    fieldCount?: number
  }

  /** Response metadata (sanitized) */
  response?: {
    type: string
    hasData: boolean
    fieldCount?: number
  }

  /** Additional audit fields from metadata */
  additionalFields?: Record<string, any>

  /** Sensitive data flag */
  containsSensitiveData: boolean
}

/**
 * Service responsible for intercepting UseCase executions and generating audit records.
 */
export class AuditInterceptor {
  constructor(
    private readonly auditLogger: AuditLogger,
    private readonly logger: Logger,
    private readonly idGenerator: IdGenerator,
    private readonly contextService?: LoggingContextService,
    private readonly entityType: string = 'usecase-execution'
  ) {}

  /**
   * Record a successful UseCase execution.
   *
   * @param useCase - The UseCase instance that was executed
   * @param request - The request that was passed to the UseCase
   * @param response - The response returned by the UseCase
   * @param executionStart - Execution start timestamp
   * @param executionEnd - Execution end timestamp
   * @param beforeState - State before execution (if captured)
   */
  async recordSuccess<TRequest, TResponse>(
    useCase: { auditMetadata: AuditMetadata },
    request: TRequest,
    response: TResponse,
    executionStart: number,
    executionEnd: number,
    beforeState?: any
  ): Promise<void> {
    const context = this.contextService?.getContext()
    if (!context) {
      // If no context is available, we can't generate a proper audit record
      // This might happen in test scenarios or misconfigured environments
      this.logger.warn('No logging context available for audit record generation', {
        operation: useCase.auditMetadata.operationId,
      })
      return
    }

    const auditRecord = await this.buildAuditRecord(
      useCase,
      request,
      response,
      executionStart,
      executionEnd,
      context,
      true,
      undefined,
      beforeState
    )

    // Generate unique ID using the configured ID generator
    const uniqueId = this.idGenerator.generateId()
    const recordId = `${auditRecord.operation}-${auditRecord.execution.startTime}-${uniqueId}`

    await this.auditLogger.recordCreate({
      id: recordId,
      timestamp: new Date(),
      operation: 'create' as const,
      actor: context.actor,
      entityType: this.entityType,
      entityId: `${auditRecord.operation}-${auditRecord.execution.startTime}`,
      source: context.source,
      traceId: context.traceId,
      before: null,
      after: auditRecord as unknown as Record<string, unknown>,
    })
  }

  /**
   * Record a failed UseCase execution.
   *
   * @param useCase - The UseCase instance that failed
   * @param request - The request that was passed to the UseCase
   * @param error - The error that occurred during execution
   * @param executionStart - Execution start timestamp
   * @param executionEnd - Execution end timestamp
   * @param beforeState - State before execution (if captured)
   */
  async recordFailure<TRequest>(
    useCase: { auditMetadata: AuditMetadata },
    request: TRequest,
    error: Error,
    executionStart: number,
    executionEnd: number,
    beforeState?: any
  ): Promise<void> {
    const context = this.contextService?.getContext()
    if (!context) {
      this.logger.warn('No logging context available for audit record generation', {
        operation: useCase.auditMetadata.operationId,
        error: error.message,
      })
      return
    }

    const auditRecord = await this.buildAuditRecord(
      useCase,
      request,
      undefined,
      executionStart,
      executionEnd,
      context,
      false,
      error,
      beforeState
    )

    // Generate unique ID using the configured ID generator
    const uniqueId = this.idGenerator.generateId()
    const recordId = `${auditRecord.operation}-${auditRecord.execution.startTime}-${uniqueId}`

    await this.auditLogger.recordCreate({
      id: recordId,
      timestamp: new Date(),
      operation: 'create' as const,
      actor: context.actor,
      entityType: this.entityType,
      entityId: `${auditRecord.operation}-${auditRecord.execution.startTime}`,
      source: context.source,
      traceId: context.traceId,
      before: null,
      after: auditRecord as unknown as Record<string, unknown>,
    })
  }

  /**
   * Build a comprehensive audit record from UseCase execution information.
   *
   * @param useCase - UseCase instance
   * @param request - Execution request
   * @param response - Execution response (if successful)
   * @param executionStart - Start timestamp
   * @param executionEnd - End timestamp
   * @param context - Logging context
   * @param success - Whether execution was successful
   * @param error - Error information (if failed)
   * @param beforeState - State before execution
   * @returns Complete audit record
   */
  private async buildAuditRecord<TRequest, TResponse>(
    useCase: { auditMetadata: AuditMetadata },
    request: TRequest,
    response: TResponse | undefined,
    executionStart: number,
    executionEnd: number,
    context: any,
    success: boolean,
    error?: Error,
    beforeState?: any
  ): Promise<UseCaseAuditRecord> {
    const { auditMetadata } = useCase
    const duration = executionEnd - executionStart

    // Extract entity ID if possible
    let entityId: string | undefined
    if (response && auditMetadata.extractEntityId) {
      try {
        entityId = auditMetadata.extractEntityId(response)
      } catch (extractError) {
        this.logger.warn('Failed to extract entity ID:', { error: extractError })
      }
    }

    // Extract after state
    let afterState: any
    if (response) {
      if (auditMetadata.extractAfterState) {
        try {
          afterState = auditMetadata.extractAfterState(request, response)
        } catch (extractError) {
          this.logger.warn('Failed to extract after state:', { error: extractError })
          afterState = response
        }
      } else {
        afterState = response
      }
    }

    // Generate additional audit fields
    let additionalFields: Record<string, any> | undefined
    if (auditMetadata.additionalAuditFields) {
      try {
        additionalFields = auditMetadata.additionalAuditFields(request, response)
      } catch (extractError) {
        this.logger.warn('Failed to extract additional audit fields:', { error: extractError })
      }
    }

    // Build the audit record
    const auditRecord: UseCaseAuditRecord = {
      operation: auditMetadata.operationId,
      entityType: auditMetadata.resourceType,
      entityId,
      actor: context.actor,
      source: context.source,
      traceId: context.traceId,
      before: beforeState,
      after: afterState,
      execution: {
        success,
        duration,
        startTime: executionStart,
        endTime: executionEnd,
        error: error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : undefined,
      },
      request: this.sanitizeMetadata(request),
      response: response ? this.sanitizeMetadata(response) : undefined,
      additionalFields,
      containsSensitiveData: auditMetadata.containsSensitiveData || false,
    }

    // Apply data sanitization if needed
    if (auditMetadata.containsSensitiveData) {
      auditRecord.before = this.sanitizeSensitiveData(auditRecord.before)
      auditRecord.after = this.sanitizeSensitiveData(auditRecord.after)
    }

    return auditRecord
  }

  /**
   * Sanitize metadata by extracting safe information for audit logging.
   *
   * @param data - Data to sanitize
   * @returns Sanitized metadata
   */
  private sanitizeMetadata(data: any): { type: string; hasData: boolean; fieldCount?: number } {
    if (data === null || data === undefined) {
      return { type: 'null', hasData: false }
    }

    const type = typeof data
    const hasData = true
    let fieldCount: number | undefined

    if (type === 'object' && !Array.isArray(data)) {
      fieldCount = Object.keys(data).length
    } else if (Array.isArray(data)) {
      fieldCount = data.length
    }

    return { type, hasData, fieldCount }
  }

  /**
   * Sanitize sensitive data by redacting sensitive fields.
   *
   * @param data - Data that may contain sensitive information
   * @param visited - WeakSet to track visited objects and prevent circular references
   * @returns Sanitized data with sensitive fields redacted
   */
  private sanitizeSensitiveData(data: any, visited: WeakSet<object> = new WeakSet()): any {
    if (!data || typeof data !== 'object') {
      return data
    }

    // Check for circular reference
    if (visited.has(data)) {
      return '[Circular Reference]'
    }

    // Mark this object as visited
    visited.add(data)

    const sensitiveKeys = [
      'password',
      'secret',
      'token',
      'key',
      'apiKey',
      'authorization',
      'ssn',
      'creditCard',
      'bankAccount',
      'personalId',
      'privateKey',
    ]

    const sanitized = Array.isArray(data) ? [...data] : { ...data }

    for (const [key, value] of Object.entries(sanitized)) {
      const lowerKey = key.toLowerCase()
      const isSensitive = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))

      if (isSensitive) {
        sanitized[key] = '[REDACTED]'
      } else if (value && typeof value === 'object') {
        sanitized[key] = this.sanitizeSensitiveData(value, visited)
      }
    }

    return sanitized
  }
}

/**
 * Factory function to create AuditInterceptor instances.
 *
 * @param auditLogger - Audit logger implementation
 * @param logger - Logger for warnings and errors
 * @param idGenerator - ID generator for unique record IDs
 * @param contextService - Optional logging context service
 * @param entityType - Optional entity type for audit records (defaults to 'usecase-execution')
 * @returns New AuditInterceptor instance
 */
export function createAuditInterceptor(
  auditLogger: AuditLogger,
  logger: Logger,
  idGenerator: IdGenerator,
  contextService?: LoggingContextService,
  entityType?: string
): AuditInterceptor {
  return new AuditInterceptor(auditLogger, logger, idGenerator, contextService, entityType)
}

/**
 * Utility functions for audit interception.
 */
export const AuditInterceptorUtils = {
  /**
   * Extract common audit information from a UseCase.
   *
   * @param useCase - UseCase instance
   * @returns Basic audit information
   */
  extractBasicAuditInfo(useCase: { auditMetadata: AuditMetadata }) {
    return {
      operationId: useCase.auditMetadata.operationId,
      entityType: useCase.auditMetadata.resourceType,
    }
  },

  /**
   * Generate execution metadata.
   *
   * @param startTime - Execution start time
   * @param endTime - Execution end time
   * @param success - Whether execution was successful
   * @param error - Error if execution failed
   * @returns Execution metadata
   */
  generateExecutionMetadata(startTime: number, endTime: number, success: boolean, error?: Error) {
    return {
      startTime,
      endTime,
      duration: endTime - startTime,
      success,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 10).join('\n'), // Limit stack trace
          }
        : undefined,
    }
  },
}

/**
 * Default export
 */
export default AuditInterceptor
