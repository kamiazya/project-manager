// Domain types

// Common interfaces
export type { UseCase } from './application/common/base-usecase.ts'
export { TicketResponse } from './application/common/ticket.response.ts'
// Use case namespaces and compatibility exports
export {
  CreateTicket,
  CreateTicketRequest,
  CreateTicketResponse,
  CreateTicketUseCase,
} from './application/usecases/create-ticket.ts'
export {
  GetAllTickets,
  GetAllTicketsRequest,
  GetAllTicketsResponse,
  GetAllTicketsUseCase,
} from './application/usecases/get-all-tickets.ts'
export {
  GetTicketById,
  GetTicketByIdRequest,
  GetTicketByIdResponse,
  GetTicketByIdUseCase,
} from './application/usecases/get-ticket-by-id.ts'

// Import namespaces to enable type extraction
import { GetAllTickets } from './application/usecases/get-all-tickets.ts'

// Extract specific types from namespaces
export type GetAllTicketsFilters = GetAllTickets.Filters
export type TicketSummary = GetAllTickets.TicketSummary

// Legacy ticket statistics (TODO: refactor to namespace pattern)
export type { TicketStatistics } from './application/common/ticket-statistics.ts'
export { createEmptyTicketStatistics } from './application/common/ticket-statistics.ts'
// Repository interfaces
export type { TicketRepository } from './application/repositories/ticket-repository.ts'
export { TicketRepository as TicketRepositorySymbol } from './application/repositories/ticket-repository.ts'

// Legacy use cases (TODO: convert to namespace pattern)
export { ArchiveTicketUseCase } from './application/usecases/archive-ticket.ts'
export { CompleteTicketUseCase } from './application/usecases/complete-ticket.ts'
export { DeleteTicketUseCase } from './application/usecases/delete-ticket.ts'
export { GetTicketStatsUseCase } from './application/usecases/get-ticket-stats.ts'
export { SearchTicketsUseCase } from './application/usecases/search-tickets.ts'
export { StartTicketProgressUseCase } from './application/usecases/start-ticket-progress.ts'
export { UpdateTicketUseCase } from './application/usecases/update-ticket.ts'
export { UpdateTicketDescriptionUseCase } from './application/usecases/update-ticket-description.ts'
export { UpdateTicketPriorityUseCase } from './application/usecases/update-ticket-priority.ts'
export { UpdateTicketStatusUseCase } from './application/usecases/update-ticket-status.ts'
export { UpdateTicketTitleUseCase } from './application/usecases/update-ticket-title.ts'

// Legacy DTO compatibility exports (TODO: remove after namespace conversion)
export class SearchTicketsRequest {
  constructor(public readonly criteria: any) {}
}
export class ArchiveTicketRequest {
  constructor(public readonly id: string) {}
}
export class CompleteTicketRequest {
  constructor(public readonly id: string) {}
}
export class DeleteTicketRequest {
  constructor(public readonly id: string) {}
}
export class StartTicketProgressRequest {
  constructor(public readonly id: string) {}
}
export class UpdateTicketRequest {
  constructor(
    public readonly id: string,
    public readonly updates: any
  ) {}

  hasUpdates(): boolean {
    return !!(
      this.updates.title ||
      this.updates.description ||
      this.updates.status ||
      this.updates.priority ||
      this.updates.type
    )
  }
}
export class UpdateTicketResponse {
  constructor(public readonly ticket: any) {}
}
export class GetTicketStatsRequest {
  constructor() {}
}
export class UpdateTicketStatusRequest {
  constructor(
    public readonly id: string,
    public readonly status: string
  ) {}
}

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

// NOTE: Infrastructure layer exports removed to comply with Clean Architecture
// CLI and MCP server should use proper dependency injection instead of directly accessing infrastructure
// TODO: Implement proper dependency injection factory pattern
