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

import { LoggingContextService } from './context-service.ts'

/**
 * Application-layer logger that automatically includes context from AsyncLocalStorage.
 * This logger acts as a bridge between the application layer and the base logging system.
 */
export class ApplicationLogger implements Logger {
  constructor(private readonly baseLogger: Logger) {}

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
    return new ApplicationLogger(childBaseLogger)
  }

  /**
   * Flush any pending log entries.
   * Delegates to the base logger's flush method.
   */
  async flush(): Promise<void> {
    await this.baseLogger.flush()
  }

  /**
   * Create a scoped logger for a specific component.
   *
   * @param component - Component name
   * @param additionalContext - Additional context for the component
   * @returns New ApplicationLogger scoped to the component
   */
  forComponent(component: string, additionalContext?: LogMetadata): ApplicationLogger {
    return this.child({
      component,
      ...additionalContext,
    })
  }

  /**
   * Create a scoped logger for a specific operation.
   *
   * @param operation - Operation name
   * @param additionalContext - Additional context for the operation
   * @returns New ApplicationLogger scoped to the operation
   */
  forOperation(operation: string, additionalContext?: LogMetadata): ApplicationLogger {
    return this.child({
      operation,
      ...additionalContext,
    })
  }

  /**
   * Create a scoped logger for a specific UseCase execution.
   *
   * @param useCaseName - UseCase class name
   * @param executionId - Optional execution identifier
   * @returns New ApplicationLogger scoped to the UseCase
   */
  forUseCase(useCaseName: string, executionId?: string): ApplicationLogger {
    return this.child({
      component: 'UseCase',
      useCase: useCaseName,
      executionId: executionId || this.generateExecutionId(),
    })
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
    const context = LoggingContextService.getContextForLogging()

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
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `exec-${timestamp}-${random}`
  }
}

/**
 * Factory function to create ApplicationLogger instances.
 *
 * @param baseLogger - The base logger implementation to wrap
 * @returns New ApplicationLogger instance
 */
export function createApplicationLogger(baseLogger: Logger): ApplicationLogger {
  return new ApplicationLogger(baseLogger)
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
   * @returns Layer-specific logger
   */
  forLayer(baseLogger: Logger, layer: string): ApplicationLogger {
    const appLogger = createApplicationLogger(baseLogger)
    return appLogger.child({ layer: layer as any })
  },

  /**
   * Create a logger for domain operations.
   *
   * @param baseLogger - Base logger instance
   * @returns Domain layer logger
   */
  forDomain(baseLogger: Logger): ApplicationLogger {
    return this.forLayer(baseLogger, 'domain')
  },

  /**
   * Create a logger for application services.
   *
   * @param baseLogger - Base logger instance
   * @returns Application layer logger
   */
  forApplication(baseLogger: Logger): ApplicationLogger {
    return this.forLayer(baseLogger, 'application')
  },

  /**
   * Create a logger for infrastructure operations.
   *
   * @param baseLogger - Base logger instance
   * @returns Infrastructure layer logger
   */
  forInfrastructure(baseLogger: Logger): ApplicationLogger {
    return this.forLayer(baseLogger, 'infrastructure')
  },
}

/**
 * Default export
 */
export default ApplicationLogger
