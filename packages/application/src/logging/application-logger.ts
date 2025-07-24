/**
 * Application Logger
 *
 * Logger implementation that automatically integrates with LoggingContextService
 * to include contextual information in all log entries.
 */

import { Logging } from '@project-manager/base'

type LogMetadata = Logging.LogMetadata
type Logger = Logging.Logger
type LogContext = Logging.LogContext
type ArchitectureLayer = Logging.ArchitectureLayer

import type { IdGenerator } from '../services/id-generator.interface.ts'
import type { LoggingContextService } from '../services/logging-context.service.ts'

/**
 * Application-layer logger that automatically includes context from AsyncLocalStorage.
 * This logger acts as a bridge between the application layer and the base logging system.
 */
export class ApplicationLogger implements Logger {
  constructor(
    private readonly baseLogger: Logger,
    private readonly contextService?: LoggingContextService,
    private readonly idGenerator?: IdGenerator
  ) {}

  /**
   * Log a debug message with automatic context integration.
   *
   * @param message - The log message
   * @param additionalMetadata - Additional metadata specific to this log entry
   */
  async debug(message: string, additionalMetadata?: LogMetadata): Promise<void> {
    const mergedMetadata = this.mergeContextWithMetadata(additionalMetadata)
    await this.baseLogger.debug(message, mergedMetadata)
  }

  /**
   * Log an info message with automatic context integration.
   *
   * @param message - The log message
   * @param additionalMetadata - Additional metadata specific to this log entry
   */
  async info(message: string, additionalMetadata?: LogMetadata): Promise<void> {
    const mergedMetadata = this.mergeContextWithMetadata(additionalMetadata)
    await this.baseLogger.info(message, mergedMetadata)
  }

  /**
   * Log a warning message with automatic context integration.
   *
   * @param message - The log message
   * @param additionalMetadata - Additional metadata specific to this log entry
   */
  async warn(message: string, additionalMetadata?: LogMetadata): Promise<void> {
    const mergedMetadata = this.mergeContextWithMetadata(additionalMetadata)
    await this.baseLogger.warn(message, mergedMetadata)
  }

  /**
   * Log an error message with automatic context integration.
   *
   * @param message - The log message
   * @param additionalMetadata - Additional metadata specific to this log entry
   */
  async error(message: string, additionalMetadata?: LogMetadata): Promise<void> {
    const mergedMetadata = this.mergeContextWithMetadata(additionalMetadata)
    await this.baseLogger.error(message, mergedMetadata)
  }

  /**
   * Create a child logger with additional context.
   * The child logger will inherit all current context and add the provided context.
   *
   * @param childContext - Additional context for the child logger
   * @returns New ApplicationLogger instance with extended context
   */
  child(childContext: LogMetadata): ApplicationLogger {
    // Create a child logger from the base logger with the additional context
    const childBaseLogger = this.baseLogger.child(childContext)
    return new ApplicationLogger(childBaseLogger, this.contextService, this.idGenerator)
  }

  /**
   * Log UseCase execution start.
   *
   * @param useCaseName - Name of the UseCase being executed
   * @param request - UseCase request (will be sanitized)
   * @param executionId - Optional execution identifier
   */
  async logUseCaseStart(useCaseName: string, request?: any, executionId?: string): Promise<void> {
    await this.info('UseCase execution started', {
      useCase: useCaseName,
      executionId: executionId || this.generateExecutionId(),
      requestType: request ? typeof request : undefined,
      hasRequest: request !== undefined,
    })
  }

  /**
   * Log UseCase execution completion.
   *
   * @param useCaseName - Name of the UseCase that completed
   * @param duration - Execution duration in milliseconds
   * @param result - UseCase result (will be sanitized)
   * @param executionId - Optional execution identifier
   */
  async logUseCaseSuccess(
    useCaseName: string,
    duration: number,
    result?: any,
    executionId?: string
  ): Promise<void> {
    await this.info('UseCase execution completed successfully', {
      useCase: useCaseName,
      duration,
      executionId: executionId || this.generateExecutionId(),
      resultType: result ? typeof result : undefined,
      hasResult: result !== undefined,
    })
  }

  /**
   * Log UseCase execution failure.
   *
   * @param useCaseName - Name of the UseCase that failed
   * @param error - The error that occurred
   * @param duration - Execution duration in milliseconds
   * @param executionId - Optional execution identifier
   */
  async logUseCaseError(
    useCaseName: string,
    error: Error,
    duration: number,
    executionId?: string
  ): Promise<void> {
    await this.error('UseCase execution failed', {
      useCase: useCaseName,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'), // Truncate stack trace
      },
      duration,
      executionId: executionId || this.generateExecutionId(),
    })
  }

  /**
   * Merge current logging context with additional metadata.
   * The additional metadata takes precedence over context values.
   *
   * @param additionalMetadata - Additional metadata to merge
   * @returns Merged metadata object
   */
  private mergeContextWithMetadata(additionalMetadata?: LogMetadata): LogMetadata | undefined {
    const context = this.contextService?.getContextForLogging()

    if (!context && !additionalMetadata) {
      return undefined
    }

    if (!context) {
      return additionalMetadata
    }

    if (!additionalMetadata) {
      return context
    }

    // Merge context and additional metadata
    // Additional metadata takes precedence for duplicate keys
    return {
      ...context,
      ...additionalMetadata,
      // Handle nested metadata objects
      metadata: {
        ...(context.metadata || {}),
        ...(additionalMetadata.metadata || {}),
      },
    }
  }

  /**
   * Generate a unique execution ID for tracking individual operations.
   *
   * @returns Unique execution identifier
   */
  private generateExecutionId(): string {
    if (this.idGenerator) {
      const id = this.idGenerator.generateId()
      return `exec-${id}`
    }

    // Fallback to original implementation if no IdGenerator is provided
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `exec-${timestamp}-${random}`
  }
}

/**
 * Factory function to create ApplicationLogger instances.
 *
 * @param baseLogger - The base logger implementation to wrap
 * @param contextService - Optional logging context service for automatic context integration
 * @param idGenerator - Optional ID generator for execution IDs
 * @returns New ApplicationLogger instance
 */
export function createApplicationLogger(
  baseLogger: Logger,
  contextService?: LoggingContextService,
  idGenerator?: IdGenerator
): ApplicationLogger {
  return new ApplicationLogger(baseLogger, contextService, idGenerator)
}

/**
 * Utility functions for application logging
 */
export const ApplicationLoggerUtils = {
  /**
   * Create a logger for a specific application layer.
   *
   * @param baseLogger - Base logger instance
   * @param layer - Application layer name
   * @param contextService - Optional logging context service
   * @returns Layer-specific logger
   */
  forLayer(
    baseLogger: Logger,
    layer: ArchitectureLayer,
    contextService?: LoggingContextService,
    idGenerator?: IdGenerator
  ): ApplicationLogger {
    const appLogger = createApplicationLogger(baseLogger, contextService, idGenerator)
    return appLogger.child({ layer })
  },

  /**
   * Create a logger for domain operations.
   *
   * @param baseLogger - Base logger instance
   * @param contextService - Optional logging context service
   * @param idGenerator - Optional ID generator for execution IDs
   * @returns Domain layer logger
   */
  forDomain(
    baseLogger: Logger,
    contextService?: LoggingContextService,
    idGenerator?: IdGenerator
  ): ApplicationLogger {
    return this.forLayer(baseLogger, 'domain', contextService, idGenerator)
  },

  /**
   * Create a logger for application services.
   *
   * @param baseLogger - Base logger instance
   * @param contextService - Optional logging context service
   * @param idGenerator - Optional ID generator for execution IDs
   * @returns Application layer logger
   */
  forApplication(
    baseLogger: Logger,
    contextService?: LoggingContextService,
    idGenerator?: IdGenerator
  ): ApplicationLogger {
    return this.forLayer(baseLogger, 'application', contextService, idGenerator)
  },

  /**
   * Create a logger for infrastructure operations.
   *
   * @param baseLogger - Base logger instance
   * @param contextService - Optional logging context service
   * @param idGenerator - Optional ID generator for execution IDs
   * @returns Infrastructure layer logger
   */
  forInfrastructure(
    baseLogger: Logger,
    contextService?: LoggingContextService,
    idGenerator?: IdGenerator
  ): ApplicationLogger {
    return this.forLayer(baseLogger, 'infrastructure', contextService, idGenerator)
  },
}

/**
 * Default export
 */
export default ApplicationLogger
