/**
 * Base interface for all use cases following the Command/Query pattern.
 * Each use case should implement this interface and provide the execute method.
 */
export interface UseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>
}

import type { ApplicationLogger } from '../logging/application-logger.ts'
import type { AuditMetadata } from '../services/audit-metadata-generator.ts'

/**
 * Base implementation for all use cases that provides automatic audit logging.
 * All use cases should extend this class to get automatic audit trail generation.
 */
export abstract class BaseUseCase<TRequest, TResponse> implements UseCase<TRequest, TResponse> {
  /** Application logger injected by the framework */
  public logger!: ApplicationLogger

  /**
   * Audit metadata for this use case.
   * Can be overridden by subclasses to provide custom metadata.
   * If not overridden, will be automatically generated based on class name.
   */
  public auditMetadata?: AuditMetadata

  /** UseCase execution to be implemented by subclasses */
  abstract execute(request: TRequest): Promise<TResponse>

  /**
   * Get the UseCase name for logging purposes.
   *
   * @returns UseCase name for logging
   */
  protected getUseCaseName(): string {
    return this.constructor.name
  }

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
      operationId: this.auditMetadata?.operationId,
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
