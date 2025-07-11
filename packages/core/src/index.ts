// Repository interfaces

// Common interfaces
export type { UseCase } from './application/common/base-usecase.js'
export { ArchiveTicketRequest } from './application/dtos/requests/archive-ticket.js'
export { CompleteTicketRequest } from './application/dtos/requests/complete-ticket.js'
// DTOs - Requests
export { CreateTicketRequest } from './application/dtos/requests/create-ticket.js'
export { DeleteTicketRequest } from './application/dtos/requests/delete-ticket.js'
export { GetAllTicketsRequest } from './application/dtos/requests/get-all-tickets.js'
export { GetTicketByIdRequest } from './application/dtos/requests/get-ticket-by-id.js'
export { GetTicketStatsRequest } from './application/dtos/requests/get-ticket-stats.js'
export { SearchTicketsRequest } from './application/dtos/requests/search-tickets.js'
export { StartTicketProgressRequest } from './application/dtos/requests/start-ticket-progress.js'
export { UpdateTicketDescriptionRequest } from './application/dtos/requests/update-ticket-description.js'
export { UpdateTicketPriorityRequest } from './application/dtos/requests/update-ticket-priority.js'
export { UpdateTicketStatusRequest } from './application/dtos/requests/update-ticket-status.js'
export { UpdateTicketTitleRequest } from './application/dtos/requests/update-ticket-title.js'
export { ArchiveTicketResponse } from './application/dtos/responses/archive-ticket.js'
export { CompleteTicketResponse } from './application/dtos/responses/complete-ticket.js'
export { CreateTicketResponse } from './application/dtos/responses/create-ticket.js'
export { DeleteTicketResponse } from './application/dtos/responses/delete-ticket.js'
export {
  GetAllTicketsResponse,
  TicketSummary,
} from './application/dtos/responses/get-all-tickets.js'
export { GetTicketByIdResponse } from './application/dtos/responses/get-ticket-by-id.js'
export { GetTicketStatsResponse } from './application/dtos/responses/get-ticket-stats.js'
export { SearchTicketsResponse } from './application/dtos/responses/search-tickets.js'
export { StartTicketProgressResponse } from './application/dtos/responses/start-ticket-progress.js'
// DTOs - Responses
export { TicketResponse } from './application/dtos/responses/ticket.js'
export { UpdateTicketDescriptionResponse } from './application/dtos/responses/update-ticket-description.js'
export { UpdateTicketPriorityResponse } from './application/dtos/responses/update-ticket-priority.js'
export { UpdateTicketStatusResponse } from './application/dtos/responses/update-ticket-status.js'
export { UpdateTicketTitleResponse } from './application/dtos/responses/update-ticket-title.js'
export type { TicketRepository } from './application/repositories/ticket-repository.js'
export { ArchiveTicketUseCase } from './application/usecases/archive-ticket.js'
export { CompleteTicketUseCase } from './application/usecases/complete-ticket.js'
// Use cases
export { CreateTicketUseCase } from './application/usecases/create-ticket.js'
export { DeleteTicketUseCase } from './application/usecases/delete-ticket.js'
export { GetAllTicketsUseCase } from './application/usecases/get-all-tickets.js'
export { GetTicketByIdUseCase } from './application/usecases/get-ticket-by-id.js'
export { GetTicketStatsUseCase } from './application/usecases/get-ticket-stats.js'
export { SearchTicketsUseCase } from './application/usecases/search-tickets.js'
export { StartTicketProgressUseCase } from './application/usecases/start-ticket-progress.js'
export { UpdateTicketDescriptionUseCase } from './application/usecases/update-ticket-description.js'
export { UpdateTicketPriorityUseCase } from './application/usecases/update-ticket-priority.js'
export { UpdateTicketStatusUseCase } from './application/usecases/update-ticket-status.js'
export { UpdateTicketTitleUseCase } from './application/usecases/update-ticket-title.js'

// Domain entities and types
export type { CreateTicketData, ReconstituteTicketData } from './domain/entities/ticket.js'
export { Ticket } from './domain/entities/ticket.js'

// Value objects
export { TicketDescription } from './domain/value-objects/ticket-description.js'
export { TicketId } from './domain/value-objects/ticket-id.js'
export { TicketPriority } from './domain/value-objects/ticket-priority.js'
export { TicketStatus } from './domain/value-objects/ticket-status.js'
export { TicketTitle } from './domain/value-objects/ticket-title.js'

// Infrastructure
export { JsonTicketRepository } from './infrastructure/adapters/json-ticket-repository.js'
export * from './infrastructure/container/inversify.config.js'
export * from './infrastructure/container/types.js'
