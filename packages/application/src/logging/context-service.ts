/**
 * Logging Context Service
 *
 * Manages logging context using AsyncLocalStorage for automatic context propagation
 * throughout the application execution flow.
 */

import { ConfigurationError } from '../common/errors/application-errors.ts'
import type { AsyncContextStorage } from '../services/async-context-storage.interface.ts'

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
  source: 'cli' | 'mcp' | 'api' | 'scheduler' | 'test'

  /** Current operation being performed */
  operation?: string

  /** Actor performing the operation */
  actor: {
    type: 'human' | 'ai' | 'system'
    id: string
    name: string
    coAuthor?: string // For AI operations with human instruction
  }

  /** Additional context metadata */
  metadata?: Record<string, any>

  /** Environment context */
  environment?: 'development' | 'production' | 'test'

  /** Correlation ID for related operations */
  correlationId?: string

  /** Parent context for nested operations */
  parentContext?: string
}

/**
 * Service for managing logging context using AsyncLocalStorage.
 * Provides automatic context propagation across asynchronous operations.
 */
export class LoggingContextService {
  private static asyncLocalStorage: AsyncContextStorage<LoggingContext> | null = null

  /**
   * Initialize the service with an AsyncContextStorage implementation.
   * This must be called during application startup.
   */
  static initialize(storage: AsyncContextStorage<LoggingContext>): void {
    LoggingContextService.asyncLocalStorage = storage
  }

  /**
   * Get the storage instance, throwing if not initialized.
   */
  private static getStorage(): AsyncContextStorage<LoggingContext> {
    if (!LoggingContextService.asyncLocalStorage) {
      throw new ConfigurationError(
        'initialization',
        'LoggingContextService not initialized. Call initialize() with an AsyncContextStorage implementation.'
      )
    }
    return LoggingContextService.asyncLocalStorage
  }

  /**
   * Run a function with the specified logging context.
   * All logging operations within the function will automatically include this context.
   *
   * @param context - The logging context to set
   * @param fn - The function to execute with the context
   * @returns Promise resolving to the function result
   */
  static run<T>(context: LoggingContext, fn: () => Promise<T>): Promise<T> {
    return LoggingContextService.getStorage().run(context, fn)
  }

  /**
   * Run a synchronous function with the specified logging context.
   *
   * @param context - The logging context to set
   * @param fn - The synchronous function to execute with the context
   * @returns The function result
   */
  static runSync<T>(context: LoggingContext, fn: () => T): T {
    return LoggingContextService.getStorage().run(context, fn)
  }

  /**
   * Get the current logging context from AsyncLocalStorage.
   *
   * @returns The current logging context, or undefined if not set
   */
  static getContext(): LoggingContext | undefined {
    return LoggingContextService.getStorage().getStore()
  }

  /**
   * Update the current context with additional information.
   * Creates a new context that inherits from the current one.
   *
   * @param updates - Partial context updates to apply
   * @returns Promise resolving when context is updated
   */
  static async updateContext(updates: Partial<LoggingContext>): Promise<void> {
    const current = LoggingContextService.getContext()
    if (!current) {
      throw new ConfigurationError('update', 'No logging context available to update')
    }

    const updated: LoggingContext = {
      ...current,
      ...updates,
      metadata: {
        ...current.metadata,
        ...updates.metadata,
      },
    }

    // Note: AsyncLocalStorage doesn't support updating the store directly
    // This method is mainly for documentation - actual updates need to be handled
    // by running new contexts with LoggingContextService.run()
  }

  /**
   * Create a child context for nested operations.
   *
   * @param childContext - Additional context for the child operation
   * @returns New context with parent reference
   */
  static createChildContext(childContext: Partial<LoggingContext>): LoggingContext {
    const parent = LoggingContextService.getContext()
    if (!parent) {
      throw new ConfigurationError('child-context', 'No parent logging context available')
    }

    return {
      ...parent,
      ...childContext,
      parentContext: parent.traceId,
      traceId: childContext.traceId || LoggingContextService.generateTraceId(),
      metadata: {
        ...parent.metadata,
        ...childContext.metadata,
      },
    }
  }

  /**
   * Check if a logging context is currently active.
   *
   * @returns True if context is available, false otherwise
   */
  static hasContext(): boolean {
    return LoggingContextService.asyncLocalStorage?.getStore() !== undefined
  }

  /**
   * Get context information as a plain object suitable for logging.
   * Filters out sensitive information and formats for log output.
   *
   * @param includeMetadata - Whether to include metadata in the output
   * @returns Formatted context object
   */
  static getContextForLogging(includeMetadata = true): Record<string, any> {
    const context = LoggingContextService.getContext()
    if (!context) {
      return {}
    }

    const logContext: Record<string, any> = {
      traceId: context.traceId,
      source: context.source,
      operation: context.operation,
      actor: {
        type: context.actor.type,
        id: LoggingContextService.sanitizeActorId(context.actor.id),
        name: context.actor.name,
      },
    }

    if (context.sessionId) {
      logContext.sessionId = context.sessionId
    }

    if (context.correlationId) {
      logContext.correlationId = context.correlationId
    }

    if (context.parentContext) {
      logContext.parentContext = context.parentContext
    }

    if (context.actor.coAuthor) {
      logContext.actor.coAuthor = LoggingContextService.sanitizeActorId(context.actor.coAuthor)
    }

    if (includeMetadata && context.metadata) {
      logContext.metadata = LoggingContextService.sanitizeMetadata(context.metadata)
    }

    return logContext
  }

  /**
   * Generate a new trace ID.
   *
   * @returns Unique trace identifier
   */
  static generateTraceId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2)
    return `trace-${timestamp}-${random}`
  }

  /**
   * Generate a new correlation ID.
   *
   * @returns Unique correlation identifier
   */
  static generateCorrelationId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2)
    return `corr-${timestamp}-${random}`
  }

  /**
   * Create a context for CLI operations.
   *
   * @param operation - The CLI operation being performed
   * @param actor - The human actor performing the operation
   * @returns CLI-specific logging context
   */
  static createCliContext(operation: string, actor: { id: string; name: string }): LoggingContext {
    return {
      traceId: LoggingContextService.generateTraceId(),
      source: 'cli',
      operation,
      actor: {
        type: 'human',
        id: actor.id,
        name: actor.name,
      },
      environment: (process.env.NODE_ENV as any) || 'development',
    }
  }

  /**
   * Create a context for MCP server operations.
   *
   * @param operation - The MCP operation being performed
   * @param aiAgent - The AI agent information
   * @param coAuthor - Optional human co-author
   * @returns MCP-specific logging context
   */
  static createMcpContext(
    operation: string,
    aiAgent: { id: string; name: string },
    coAuthor?: string
  ): LoggingContext {
    return {
      traceId: LoggingContextService.generateTraceId(),
      source: 'mcp',
      operation,
      actor: {
        type: 'ai',
        id: aiAgent.id,
        name: aiAgent.name,
        coAuthor,
      },
      environment: (process.env.NODE_ENV as any) || 'development',
    }
  }

  /**
   * Create a context for system operations.
   *
   * @param operation - The system operation being performed
   * @param systemId - The system component identifier
   * @returns System-specific logging context
   */
  static createSystemContext(operation: string, systemId: string): LoggingContext {
    return {
      traceId: LoggingContextService.generateTraceId(),
      source: 'scheduler',
      operation,
      actor: {
        type: 'system',
        id: systemId,
        name: `System: ${systemId}`,
      },
      environment: (process.env.NODE_ENV as any) || 'production',
    }
  }

  /**
   * Sanitize actor ID for logging (remove sensitive information).
   *
   * @param actorId - The actor ID to sanitize
   * @returns Sanitized actor ID
   */
  private static sanitizeActorId(actorId: string): string {
    // For security, hash long IDs or mask sensitive parts
    if (actorId.length > 20) {
      return `${actorId.substring(0, 8)}...${actorId.substring(actorId.length - 4)}`
    }
    return actorId
  }

  /**
   * Sanitize metadata for logging (remove sensitive keys).
   *
   * @param metadata - The metadata to sanitize
   * @returns Sanitized metadata
   */
  private static sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'apiKey', 'authorization']
    const sanitized: Record<string, any> = {}

    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase()
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }
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

/**
 * Default export for the service
 */
export default LoggingContextService
