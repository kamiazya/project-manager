/**
 * Auditable UseCase Interface and Types
 *
 * Defines interfaces and types for UseCases that support automatic audit logging.
 * This enables transparent audit trail generation without modifying business logic.
 */

import type { UseCase } from '../common/base-usecase.ts'
import type { ApplicationLogger } from './application-logger.ts'

/**
 * Audit metadata that defines how to automatically generate audit records
 * for a specific UseCase operation.
 */
export interface AuditMetadata {
  /**
   * Unique identifier for this operation type.
   * Examples: 'create-ticket', 'update-ticket-status', 'delete-project'
   */
  operationId: string

  /**
   * Type of operation being performed.
   * Examples: 'create', 'read', 'update', 'delete', 'search'
   */
  operationType: 'create' | 'read' | 'update' | 'delete' | 'search'

  /**
   * Type of resource being operated on.
   * Examples: 'Ticket', 'Project', 'User'
   */
  resourceType: string

  /**
   * Human-readable description of what this operation does.
   * Examples: 'Creates a new ticket', 'Updates ticket status', 'Retrieves system logs'
   */
  description: string

  /**
   * Display name for the UseCase (for logging purposes).
   * Examples: 'CreateTicket', 'UpdateTicketStatus', 'DeleteProject'
   */
  useCaseName: string

  /**
   * Function to extract the entity ID from the UseCase response.
   * Required for create/update/delete operations to link audit records to specific entities.
   */
  extractEntityId?: (response: any) => string | undefined

  /**
   * Function to extract the before state for update operations.
   * This is called before the UseCase execution to capture the current state.
   */
  extractBeforeState?: (request: any) => Promise<any>

  /**
   * Function to extract the after state for create/update operations.
   * By default, uses the UseCase response as the after state.
   */
  extractAfterState?: (request: any, response: any) => any

  /**
   * Indicates if this operation contains sensitive data that should be filtered
   * from audit logs. If true, sensitive fields will be redacted.
   */
  containsSensitiveData?: boolean

  /**
   * Custom fields to include in the audit record.
   * These will be merged with the standard audit fields.
   */
  additionalAuditFields?: (request: any, response?: any) => Record<string, any>

  /**
   * Risk level of this operation for compliance purposes.
   * High risk operations may require additional approval or logging.
   */
  riskLevel?: 'low' | 'medium' | 'high'

  /**
   * Data classification level for compliance.
   * Determines retention periods and access controls.
   */
  dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted'

  /**
   * Whether this operation requires retention for compliance.
   * If true, audit records will be kept for extended periods.
   */
  requiresRetention?: boolean
}

/**
 * Extended UseCase interface that includes audit metadata.
 * All UseCases that need automatic audit logging should implement this interface.
 */
export interface AuditableUseCase<TRequest, TResponse> extends UseCase<TRequest, TResponse> {
  /**
   * Audit metadata defining how to generate audit records for this UseCase.
   * This is required and must be provided by each implementing class.
   */
  readonly auditMetadata: AuditMetadata

  /**
   * Application logger instance that will be injected by the framework.
   * This provides automatic context integration for all log entries.
   */
  logger: ApplicationLogger
}

/**
 * Type guard to check if a UseCase implements AuditableUseCase.
 *
 * @param useCase - UseCase instance to check
 * @returns True if the UseCase is auditable
 */
export function isAuditableUseCase(useCase: any): useCase is AuditableUseCase<any, any> {
  return (
    useCase &&
    typeof useCase === 'object' &&
    'auditMetadata' in useCase &&
    typeof useCase.auditMetadata === 'object' &&
    typeof useCase.auditMetadata.operationId === 'string' &&
    typeof useCase.auditMetadata.resourceType === 'string'
  )
}

/**
 * Utility functions for working with auditable UseCases.
 */
export const AuditableUseCaseUtils = {
  /**
   * Create standard audit metadata for CRUD operations.
   *
   * @param operation - CRUD operation type
   * @param entityType - Entity type being operated on
   * @param options - Additional configuration options
   * @returns Standard audit metadata
   */
  createCrudMetadata(
    operation: 'create' | 'read' | 'update' | 'delete',
    entityType: string,
    options: {
      extractEntityId?: (response: any) => string | undefined
      extractBeforeState?: (request: any) => Promise<any>
      riskLevel?: 'low' | 'medium' | 'high'
      dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted'
      containsSensitiveData?: boolean
    } = {}
  ): AuditMetadata {
    return {
      operationId: `${operation}-${entityType}`,
      operationType: operation as 'create' | 'read' | 'update' | 'delete' | 'search',
      resourceType: entityType,
      description: `${operation.charAt(0).toUpperCase() + operation.slice(1)}s a ${entityType}`,
      useCaseName: `${operation.charAt(0).toUpperCase() + operation.slice(1)}${entityType}`,
      extractEntityId:
        options.extractEntityId ||
        ((response: any) => {
          // Standard patterns for extracting IDs
          return response?.id || response?.entityId || response?.[`${entityType}Id`]
        }),
      extractBeforeState: options.extractBeforeState,
      riskLevel: options.riskLevel || (operation === 'delete' ? 'high' : 'medium'),
      dataClassification: options.dataClassification || 'internal',
      containsSensitiveData: options.containsSensitiveData || false,
      requiresRetention: operation === 'delete' || options.dataClassification === 'restricted',
    }
  },

  /**
   * Create audit metadata for ticket operations.
   *
   * @param operation - Ticket operation type
   * @param options - Additional configuration options
   * @returns Ticket-specific audit metadata
   */
  createTicketMetadata(
    operation: 'create' | 'update-status' | 'update-content' | 'update-priority' | 'delete',
    options: {
      extractBeforeState?: (request: any) => Promise<any>
      riskLevel?: 'low' | 'medium' | 'high'
    } = {}
  ): AuditMetadata {
    const baseOperation = operation.startsWith('update') ? 'update' : operation

    return {
      operationId: `${operation}-ticket`,
      operationType: baseOperation as 'create' | 'read' | 'update' | 'delete' | 'search',
      resourceType: 'Ticket',
      description: `${operation.charAt(0).toUpperCase() + operation.slice(1).replace(/-/g, ' ')} ticket`,
      useCaseName: `${operation
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')}Ticket`,
      extractEntityId: (response: any) => response?.id,
      extractBeforeState: options.extractBeforeState,
      riskLevel: options.riskLevel || (operation === 'delete' ? 'high' : 'low'),
      dataClassification: 'internal',
      containsSensitiveData: false,
      requiresRetention: operation === 'delete',
      additionalAuditFields: (_request: any, response?: any) => ({
        ticketOperation: operation,
        hasAttachments: response?.attachments?.length > 0,
        fieldCount: response ? Object.keys(response).length : 0,
      }),
    }
  },

  /**
   * Validate audit metadata for completeness and correctness.
   *
   * @param metadata - Audit metadata to validate
   * @returns Array of validation errors (empty if valid)
   */
  validateMetadata(metadata: AuditMetadata): string[] {
    const errors: string[] = []

    if (!metadata.operationId || metadata.operationId.trim() === '') {
      errors.push('operationId is required and cannot be empty')
    }

    if (!metadata.resourceType || metadata.resourceType.trim() === '') {
      errors.push('resourceType is required and cannot be empty')
    }

    if (metadata.riskLevel && !['low', 'medium', 'high'].includes(metadata.riskLevel)) {
      errors.push('riskLevel must be one of: low, medium, high')
    }

    if (
      metadata.dataClassification &&
      !['public', 'internal', 'confidential', 'restricted'].includes(metadata.dataClassification)
    ) {
      errors.push('dataClassification must be one of: public, internal, confidential, restricted')
    }

    return errors
  },
}

/**
 * Base implementation helper for AuditableUseCase.
 * Provides common functionality that can be extended by concrete UseCases.
 */
export abstract class BaseAuditableUseCase<TRequest, TResponse>
  implements AuditableUseCase<TRequest, TResponse>
{
  /** Application logger injected by the framework */
  public logger!: ApplicationLogger

  /** Audit metadata to be provided by subclasses */
  abstract readonly auditMetadata: AuditMetadata

  /** UseCase execution to be implemented by subclasses */
  abstract execute(request: TRequest): Promise<TResponse>

  /**
   * Get the UseCase name for logging purposes.
   * Override this method or set the useCaseName property in subclasses.
   *
   * @returns UseCase name for logging
   */
  protected getUseCaseName(): string {
    return this.useCaseName || this.constructor.name
  }

  /**
   * Optional explicit name for the UseCase (recommended for better logging).
   * Should be set in subclass constructors.
   */
  protected useCaseName?: string

  /**
   * Log with UseCase-specific context.
   *
   * @param level - Log level
   * @param message - Log message
   * @param metadata - Additional metadata
   */
  protected async log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const contextualMetadata = {
      useCase: this.getUseCaseName(),
      operationId: this.auditMetadata.operationId,
      ...metadata,
    }

    switch (level) {
      case 'debug':
        await this.logger.debug(message, contextualMetadata)
        break
      case 'info':
        await this.logger.info(message, contextualMetadata)
        break
      case 'warn':
        await this.logger.warn(message, contextualMetadata)
        break
      case 'error':
        await this.logger.error(message, contextualMetadata)
        break
    }
  }

  /**
   * Convenience method for info logging.
   */
  protected async logInfo(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log('info', message, metadata)
  }

  /**
   * Convenience method for debug logging.
   */
  protected async logDebug(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log('debug', message, metadata)
  }

  /**
   * Convenience method for warn logging.
   */
  protected async logWarn(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log('warn', message, metadata)
  }

  /**
   * Convenience method for error logging.
   */
  protected async logError(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log('error', message, metadata)
  }
}

/**
 * Type definitions for UseCase execution results with audit information.
 */
export interface UseCaseExecutionResult<TResponse> {
  /** The UseCase response */
  response: TResponse

  /** Execution metadata */
  execution: {
    startTime: number
    endTime: number
    duration: number
    success: boolean
    error?: Error
  }

  /** Audit information */
  audit: {
    operationId: string
    entityType: string
    entityId?: string
    beforeState?: any
    afterState?: any
  }
}

/**
 * Default export - utility functions for auditable use cases
 */
export default AuditableUseCaseUtils
