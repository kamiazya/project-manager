/**
 * Application Layer
 *
 * Contains use cases, application services, and DTOs.
 * Depends only on the Domain layer and shared utilities.
 * Should not contain any infrastructure concerns.
 */

// Re-export Domain layer types for consumers
export * from '@project-manager/domain'

// Common application interfaces and base classes
export * from './common/base-usecase.ts'
export * from './common/ticket.response.ts'
export * from './common/ticket-statistics.ts'
// Factories
export * from './factories/use-case-factory.ts'
export * from './factories/use-case-factory-provider.ts'
// Repository interfaces (will be implemented in infrastructure layer)
export * from './repositories/ticket-repository.ts'
// Use cases
export * from './usecases/archive-ticket.ts'
export * from './usecases/complete-ticket.ts'
export * from './usecases/create-ticket.ts'
export * from './usecases/delete-ticket.ts'
export * from './usecases/get-all-tickets.ts'
export * from './usecases/get-ticket-by-id.ts'
export * from './usecases/get-ticket-stats.ts'
export * from './usecases/search-tickets.ts'
export * from './usecases/start-ticket-progress.ts'
export * from './usecases/update-ticket.ts'
export * from './usecases/update-ticket-description.ts'
export * from './usecases/update-ticket-priority.ts'
export * from './usecases/update-ticket-status.ts'
export * from './usecases/update-ticket-title.ts'
