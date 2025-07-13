// Repository interfaces

// Common interfaces
export type { UseCase } from './application/common/base-usecase.ts'
export { ArchiveTicketRequest } from './application/dtos/requests/archive-ticket.ts'
export { CompleteTicketRequest } from './application/dtos/requests/complete-ticket.ts'
// DTOs - Requests
export { CreateTicketRequest } from './application/dtos/requests/create-ticket.ts'
export { DeleteTicketRequest } from './application/dtos/requests/delete-ticket.ts'
export {
  type GetAllTicketsFilters,
  GetAllTicketsRequest,
} from './application/dtos/requests/get-all-tickets.ts'
export { GetTicketByIdRequest } from './application/dtos/requests/get-ticket-by-id.ts'
export { GetTicketStatsRequest } from './application/dtos/requests/get-ticket-stats.ts'
export { SearchTicketsRequest } from './application/dtos/requests/search-tickets.ts'
export { StartTicketProgressRequest } from './application/dtos/requests/start-ticket-progress.ts'
export { UpdateTicketDescriptionRequest } from './application/dtos/requests/update-ticket-description.ts'
export { UpdateTicketPriorityRequest } from './application/dtos/requests/update-ticket-priority.ts'
export { UpdateTicketStatusRequest } from './application/dtos/requests/update-ticket-status.ts'
export { UpdateTicketTitleRequest } from './application/dtos/requests/update-ticket-title.ts'
export { ArchiveTicketResponse } from './application/dtos/responses/archive-ticket.ts'
export { CompleteTicketResponse } from './application/dtos/responses/complete-ticket.ts'
export { CreateTicketResponse } from './application/dtos/responses/create-ticket.ts'
export { DeleteTicketResponse } from './application/dtos/responses/delete-ticket.ts'
export {
  GetAllTicketsResponse,
  TicketSummary,
} from './application/dtos/responses/get-all-tickets.ts'
export { GetTicketByIdResponse } from './application/dtos/responses/get-ticket-by-id.ts'
export { GetTicketStatsResponse } from './application/dtos/responses/get-ticket-stats.ts'
export { SearchTicketsResponse } from './application/dtos/responses/search-tickets.ts'
export { StartTicketProgressResponse } from './application/dtos/responses/start-ticket-progress.ts'
// DTOs - Responses
export { TicketResponse } from './application/dtos/responses/ticket.ts'
export { UpdateTicketDescriptionResponse } from './application/dtos/responses/update-ticket-description.ts'
export { UpdateTicketPriorityResponse } from './application/dtos/responses/update-ticket-priority.ts'
export { UpdateTicketStatusResponse } from './application/dtos/responses/update-ticket-status.ts'
export { UpdateTicketTitleResponse } from './application/dtos/responses/update-ticket-title.ts'
export type { TicketRepository } from './application/repositories/ticket-repository.ts'
export { ArchiveTicketUseCase } from './application/usecases/archive-ticket.ts'
export { CompleteTicketUseCase } from './application/usecases/complete-ticket.ts'
// Use cases
export { CreateTicketUseCase } from './application/usecases/create-ticket.ts'
export { DeleteTicketUseCase } from './application/usecases/delete-ticket.ts'
export { GetAllTicketsUseCase } from './application/usecases/get-all-tickets.ts'
export { GetTicketByIdUseCase } from './application/usecases/get-ticket-by-id.ts'
export { GetTicketStatsUseCase } from './application/usecases/get-ticket-stats.ts'
export { SearchTicketsUseCase } from './application/usecases/search-tickets.ts'
export { StartTicketProgressUseCase } from './application/usecases/start-ticket-progress.ts'
export { UpdateTicketDescriptionUseCase } from './application/usecases/update-ticket-description.ts'
export { UpdateTicketPriorityUseCase } from './application/usecases/update-ticket-priority.ts'
export { UpdateTicketStatusUseCase } from './application/usecases/update-ticket-status.ts'
export { UpdateTicketTitleUseCase } from './application/usecases/update-ticket-title.ts'

// Domain entities and types
export type { CreateTicketData, ReconstituteTicketData } from './domain/entities/ticket.ts'
export { Ticket } from './domain/entities/ticket.ts'

// Value objects
export { TicketDescription } from './domain/value-objects/ticket-description.ts'
export { TicketId } from './domain/value-objects/ticket-id.ts'
export { TicketPriority } from './domain/value-objects/ticket-priority.ts'
export { TicketStatus } from './domain/value-objects/ticket-status.ts'
export { TicketTitle } from './domain/value-objects/ticket-title.ts'

// Infrastructure
export { JsonTicketRepository } from './infrastructure/adapters/json-ticket-repository.ts'
export * from './infrastructure/container/inversify.config.ts'
export * from './infrastructure/container/types.ts'
