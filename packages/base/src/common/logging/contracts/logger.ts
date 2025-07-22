/**
 * Logger interface providing unified logging capabilities across all architectural layers.
 *
 * This interface follows Clean Architecture principles by being defined in the Foundation Layer,
 * making it available to all other layers while keeping implementation details in Infrastructure.
 */

import type {
  ArchitectureLayer,
  LogContext,
  LogMetadata,
  LogSource,
  OperationType,
} from '../types/log-metadata.ts'
export interface Logger {
  /**
   * Log debug information for development troubleshooting.
   * Debug logs should include detailed context that helps developers understand system behavior.
   *
   * @param message - Human-readable description of what happened
   * @param metadata - Structured data providing context (traceId, component, etc.)
   */
  debug(message: string, metadata?: LogMetadata): Promise<void>

  /**
   * Log general information about application flow.
   * Info logs represent normal application behavior and important milestones.
   *
   * @param message - Human-readable description of what happened
   * @param metadata - Structured data providing context (traceId, component, etc.)
   */
  info(message: string, metadata?: LogMetadata): Promise<void>

  /**
   * Log warning conditions that should be addressed.
   * Warnings represent recoverable issues that may require attention.
   *
   * @param message - Human-readable description of what happened
   * @param metadata - Structured data providing context (traceId, component, etc.)
   */
  warn(message: string, metadata?: LogMetadata): Promise<void>

  /**
   * Log error conditions that require immediate attention.
   * Errors represent failure conditions that impact system functionality.
   *
   * @param message - Human-readable description of what happened
   * @param metadata - Structured data providing context (traceId, component, etc.)
   */
  error(message: string, metadata?: LogMetadata): Promise<void>

  /**
   * Create a child logger with persistent context.
   * Child loggers inherit parent configuration but add persistent metadata.
   *
   * @param context - Persistent context to add to all log entries from this child
   * @returns A new Logger instance with the additional context
   */
  child(context: LogContext): Logger

  /**
   * Flush any pending log entries to ensure they are written.
   * This is useful for ensuring logs are written before application shutdown.
   */
  flush(): Promise<void>
}
