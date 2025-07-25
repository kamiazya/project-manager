/**
 * Application Layer
 *
 * Contains use cases, application services, and DTOs.
 * Depends only on the Domain layer and shared utilities.
 * Should not contain any infrastructure concerns.
 */

// Re-export Domain layer types for consumers (excluding errors that we override)
export * from '@project-manager/domain'
// Common application interfaces and base classes
export * from './common/base-usecase.ts'
// Application layer errors (override domain errors)
export {
  ApplicationError,
  ConfigurationError,
  IdGenerationError,
  InfrastructureError,
  LoggingError,
  PersistenceError,
  TicketNotFoundError,
  TicketValidationError,
  UseCaseExecutionError,
} from './common/errors/application-errors.ts'
// Event system interfaces
export * from './common/events/event-emitter.ts'
export * from './common/ticket.response.ts'
// Logging services
export * from './logging/index.ts'
// Repository interfaces (will be implemented in infrastructure layer)
export * from './repositories/ticket-repository.ts'
// Services
export * from './services/async-context-storage.interface.ts'
export * from './services/audit-metadata-generator.ts'
export * from './services/development-process.ts'
export * from './services/environment-detection.ts'
export * from './services/id-generator.interface.ts'
export * from './services/storage-config.ts'
// Use cases
export * from './usecases/create-ticket.ts'
export * from './usecases/delete-ticket.ts'
export * from './usecases/get-audit-logs.ts'
export * from './usecases/get-logs.ts'
export * from './usecases/get-ticket-by-id.ts'
export * from './usecases/search-tickets.ts'
export * from './usecases/update-ticket-content.ts'
export * from './usecases/update-ticket-priority.ts'
export * from './usecases/update-ticket-status.ts'
