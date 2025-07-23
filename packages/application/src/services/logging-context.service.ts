/**
 * Logging Context Service Interface
 *
 * Defines the contract for managing logging context across asynchronous operations.
 * The implementation will be provided by the Infrastructure layer.
 */

import type { ActorType, EnvironmentMode, LogSource } from '@project-manager/base'

/**
 * Logging context interface containing all contextual information
 * that should be automatically included in logs and audit records.
 */
export interface LoggingContext {
  /** Unique trace identifier for request tracking */
  traceId: string

  /** Session identifier */
  sessionId?: string

  /** Source of the operation (cli, mcp, api, etc.) */
  source: LogSource

  /** Current operation being performed */
  operation?: string

  /** Actor performing the operation */
  actor: {
    type: ActorType
    id: string
    name: string
    coAuthor?: string // For AI operations with human instruction
  }

  /** Additional context metadata */
  metadata?: Record<string, any>

  /** Environment context */
  environment?: EnvironmentMode

  /** Correlation ID for related operations */
  correlationId?: string

  /** Parent context for nested operations */
  parentContext?: string
}

/**
 * Service interface for managing logging context.
 * Provides automatic context propagation across asynchronous operations.
 */
export interface LoggingContextService {
  run<T>(context: LoggingContext, fn: () => Promise<T>): Promise<T>
  runSync<T>(context: LoggingContext, fn: () => T): T
  getContext(): LoggingContext | undefined
  createUpdatedContext(updates: Partial<LoggingContext>): LoggingContext
  createChildContext(childContext: Partial<LoggingContext>): LoggingContext
  hasContext(): boolean
  getContextForLogging(includeMetadata?: boolean): Record<string, any>
  runWithUpdatedContext<T>(updates: Partial<LoggingContext>, fn: () => Promise<T>): Promise<T>
  runWithUpdatedContextSync<T>(updates: Partial<LoggingContext>, fn: () => T): T
}

/**
 * Type guard to check if an object is a valid LoggingContext.
 *
 * @param obj - Object to check
 * @returns True if object is a valid LoggingContext
 */
export function isLoggingContext(obj: any): obj is LoggingContext {
  return (
    obj &&
    typeof obj.traceId === 'string' &&
    typeof obj.source === 'string' &&
    obj.actor &&
    typeof obj.actor.type === 'string' &&
    typeof obj.actor.id === 'string' &&
    typeof obj.actor.name === 'string'
  )
}
