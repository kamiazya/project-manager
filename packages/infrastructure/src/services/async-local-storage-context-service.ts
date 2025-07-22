/**
 * AsyncLocalStorage-based Context Service Implementation
 *
 * Provides logging context management using Node.js AsyncLocalStorage.
 * This implementation maintains context across asynchronous operations.
 */

import type {
  AsyncContextStorage,
  LoggingContext,
  LoggingContextService,
} from '@project-manager/application'
import { ConfigurationError } from '@project-manager/application'

/**
 * Singleton service for managing logging context using AsyncLocalStorage.
 * Provides automatic context propagation across asynchronous operations.
 */
export class AsyncLocalStorageContextService implements LoggingContextService {
  private static instance: AsyncLocalStorageContextService | null = null
  private asyncLocalStorage: AsyncContextStorage<LoggingContext>

  private constructor(storage: AsyncContextStorage<LoggingContext>) {
    this.asyncLocalStorage = storage
  }

  /**
   * Get the singleton instance of LoggingContextService.
   * Throws if not initialized.
   */
  static getInstance(): AsyncLocalStorageContextService {
    if (!AsyncLocalStorageContextService.instance) {
      throw new ConfigurationError(
        'initialization',
        'AsyncLocalStorageContextService not initialized. Call initialize() with an AsyncContextStorage implementation first.'
      )
    }
    return AsyncLocalStorageContextService.instance
  }

  /**
   * Initialize the singleton service with an AsyncContextStorage implementation.
   * This must be called during application startup.
   */
  static initialize(storage: AsyncContextStorage<LoggingContext>): AsyncLocalStorageContextService {
    if (AsyncLocalStorageContextService.instance) {
      throw new ConfigurationError(
        'initialization',
        'AsyncLocalStorageContextService already initialized. Use getInstance() to access the service.'
      )
    }
    AsyncLocalStorageContextService.instance = new AsyncLocalStorageContextService(storage)
    return AsyncLocalStorageContextService.instance
  }

  /**
   * Reset the singleton instance (mainly for testing).
   */
  static reset(): void {
    AsyncLocalStorageContextService.instance = null
  }

  /**
   * Get the storage instance.
   */
  private getStorage(): AsyncContextStorage<LoggingContext> {
    return this.asyncLocalStorage
  }

  /**
   * Run a function with the specified logging context.
   * All logging operations within the function will automatically include this context.
   *
   * @param context - The logging context to set
   * @param fn - The function to execute with the context
   * @returns Promise resolving to the function result
   */
  run<T>(context: LoggingContext, fn: () => Promise<T>): Promise<T> {
    return this.getStorage().run(context, fn)
  }

  /**
   * Run a synchronous function with the specified logging context.
   *
   * @param context - The logging context to set
   * @param fn - The synchronous function to execute with the context
   * @returns The function result
   */
  runSync<T>(context: LoggingContext, fn: () => T): T {
    return this.getStorage().run(context, fn)
  }

  /**
   * Get the current logging context from AsyncLocalStorage.
   *
   * @returns The current logging context, or undefined if not set
   */
  getContext(): LoggingContext | undefined {
    return this.getStorage().getStore()
  }

  /**
   * Update the current context with additional information.
   *
   * NOTE: AsyncLocalStorage does not support direct context updates.
   * To update context, you must create a new context scope using run().
   * This method throws an error to prevent confusion.
   *
   * @param updates - Partial context updates to apply
   * @throws {ConfigurationError} Always throws - direct context updates not supported
   */
  async updateContext(updates: Partial<LoggingContext>): Promise<void> {
    throw new ConfigurationError(
      'updateContext',
      'Direct context updates are not supported with AsyncLocalStorage. ' +
        'Use LoggingContextService.run() to create a new context scope with updated values.'
    )
  }

  /**
   * Create an updated context object for use with run().
   * This method creates a new context that inherits from the current one
   * but does not apply it. Use the returned context with run().
   *
   * @param updates - Partial context updates to apply
   * @returns New context object with updates applied
   * @throws {ConfigurationError} If no current context is available
   */
  createUpdatedContext(updates: Partial<LoggingContext>): LoggingContext {
    const current = this.getContext()
    if (!current) {
      throw new ConfigurationError('createUpdatedContext', 'No logging context available to update')
    }

    return {
      ...current,
      ...updates,
      metadata: {
        ...current.metadata,
        ...updates.metadata,
      },
    }
  }

  /**
   * Create a child context for nested operations.
   *
   * @param childContext - Additional context for the child operation
   * @returns New context with parent reference
   */
  createChildContext(childContext: Partial<LoggingContext>): LoggingContext {
    const parent = this.getContext()
    if (!parent) {
      throw new ConfigurationError('child-context', 'No parent logging context available')
    }

    return {
      ...parent,
      ...childContext,
      parentContext: parent.traceId,
      traceId: childContext.traceId || AsyncLocalStorageContextService.generateTraceId(),
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
  hasContext(): boolean {
    return this.asyncLocalStorage?.getStore() !== undefined
  }

  /**
   * Get context information as a plain object suitable for logging.
   * Filters out sensitive information and formats for log output.
   *
   * @param includeMetadata - Whether to include metadata in the output
   * @returns Formatted context object
   */
  getContextForLogging(includeMetadata = true): Record<string, any> {
    const context = this.getContext()
    if (!context) {
      return {}
    }

    const logContext: Record<string, any> = {
      traceId: context.traceId,
      source: context.source,
      operation: context.operation,
      actor: {
        type: context.actor.type,
        id: AsyncLocalStorageContextService.sanitizeActorId(context.actor.id),
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
      logContext.actor.coAuthor = AsyncLocalStorageContextService.sanitizeActorId(
        context.actor.coAuthor
      )
    }

    if (includeMetadata && context.metadata) {
      logContext.metadata = AsyncLocalStorageContextService.sanitizeMetadata(context.metadata)
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
      traceId: AsyncLocalStorageContextService.generateTraceId(),
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
      traceId: AsyncLocalStorageContextService.generateTraceId(),
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
      traceId: AsyncLocalStorageContextService.generateTraceId(),
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

  /**
   * Execute a function with updated context.
   * This is the recommended way to "update" context by creating a new scope.
   *
   * @param updates - Partial context updates to apply
   * @param fn - Function to execute with updated context
   * @returns Result of the function execution
   * @example
   * ```typescript
   * // Instead of updateContext (which throws), use runWithUpdatedContext
   * await loggingContextService.runWithUpdatedContext(
   *   { operation: 'nested-operation' },
   *   async () => {
   *     // This code runs with updated context
   *     await someOperation()
   *   }
   * )
   * ```
   */
  async runWithUpdatedContext<T>(
    updates: Partial<LoggingContext>,
    fn: () => Promise<T>
  ): Promise<T> {
    const updatedContext = this.createUpdatedContext(updates)
    return this.run(updatedContext, fn)
  }

  /**
   * Execute a function with updated context (synchronous version).
   *
   * @param updates - Partial context updates to apply
   * @param fn - Function to execute with updated context
   * @returns Result of the function execution
   */
  runWithUpdatedContextSync<T>(updates: Partial<LoggingContext>, fn: () => T): T {
    const updatedContext = this.createUpdatedContext(updates)
    return this.runSync(updatedContext, fn)
  }
}

/**
 * Default export for the implementation
 */
export default AsyncLocalStorageContextService
