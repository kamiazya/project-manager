// Domain types

// Common interfaces
export type { UseCase } from './application/common/base-usecase.ts'
export { TicketResponse } from './application/common/ticket.response.ts'
// Use case namespaces
export { ArchiveTicket } from './application/usecases/archive-ticket.ts'
export { CompleteTicket } from './application/usecases/complete-ticket.ts'
export { CreateTicket } from './application/usecases/create-ticket.ts'
export { DeleteTicket } from './application/usecases/delete-ticket.ts'
export { GetAllTickets } from './application/usecases/get-all-tickets.ts'
export { GetTicketById } from './application/usecases/get-ticket-by-id.ts'
export { GetTicketStats } from './application/usecases/get-ticket-stats.ts'
export { SearchTickets } from './application/usecases/search-tickets.ts'
export { StartTicketProgress } from './application/usecases/start-ticket-progress.ts'
export { UpdateTicket } from './application/usecases/update-ticket.ts'
export { UpdateTicketDescription } from './application/usecases/update-ticket-description.ts'
export { UpdateTicketPriority } from './application/usecases/update-ticket-priority.ts'
export { UpdateTicketStatus } from './application/usecases/update-ticket-status.ts'
export { UpdateTicketTitle } from './application/usecases/update-ticket-title.ts'

// Import namespaces to enable type extraction
import { GetAllTickets } from './application/usecases/get-all-tickets.ts'

// Extract specific types from namespaces
export type GetAllTicketsFilters = GetAllTickets.Filters
export type TicketSummary = GetAllTickets.TicketSummary

export type { TicketStatistics } from './application/common/ticket-statistics.ts'
// Legacy ticket statistics (TODO: refactor to namespace pattern)
export { createEmptyTicketStatistics } from './application/common/ticket-statistics.ts'
export type { TicketRepository } from './application/repositories/ticket-repository.ts'
// Repository interfaces
export { TicketRepository as TicketRepositorySymbol } from './application/repositories/ticket-repository.ts'

// Import additional namespaces to enable type extraction
import { SearchTickets } from './application/usecases/search-tickets.ts'
import { UpdateTicket } from './application/usecases/update-ticket.ts'

// Extract specific types from namespaces
export type SearchCriteria = SearchTickets.SearchCriteria
export type UpdateTicketData = UpdateTicket.Request

// Legacy use cases (converted to namespace pattern) - all exports now available through namespace pattern above

// NOTE: Infrastructure layer exports removed to comply with Clean Architecture
// MCP server should use proper dependency injection instead of directly accessing container
export type {
  CreateTicketData,
  ReconstituteTicketData,
  TicketProps,
} from './domain/entities/ticket.ts'
// Domain entities
export { Ticket } from './domain/entities/ticket.ts'
export type {
  TicketPriority,
  TicketPrivacy,
  TicketStatus,
  TicketType,
} from './domain/types/ticket-types.ts'
export {
  isValidTicketPriority,
  isValidTicketPrivacy,
  isValidTicketStatus,
  isValidTicketType,
  TICKET_DEFAULTS,
  TicketValidationError,
} from './domain/types/ticket-types.ts'
export { TicketDescription } from './domain/value-objects/ticket-description.ts'
// Domain value objects
export { TicketId } from './domain/value-objects/ticket-id.ts'
export { TicketPriority as TicketPriorityVO } from './domain/value-objects/ticket-priority.ts'
export { TicketStatus as TicketStatusVO } from './domain/value-objects/ticket-status.ts'
export { TicketTitle } from './domain/value-objects/ticket-title.ts'

// Domain entities and value objects are now exported at the top of the file

// Infrastructure layer is NOT exported to enforce Clean Architecture
// External packages should depend on repository interfaces, not concrete implementations
// Infrastructure implementations are available internally but not exposed through public API

export { UseCaseFactory } from './application/factories/use-case-factory.ts'
// Use Case Factory Pattern - Clean Architecture compliant dependency injection
export {
  type UseCaseFactoryConfig,
  UseCaseFactoryProvider,
} from './application/factories/use-case-factory-provider.ts'

// Infrastructure types are not exported to maintain Clean Architecture boundaries
// Use UseCaseFactory pattern for dependency injection instead
