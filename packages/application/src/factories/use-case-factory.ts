/**
 * Factory for creating use cases with proper dependency injection
 * This provides a Clean Architecture compliant way to access use cases
 * without exposing infrastructure layer details
 */

import type { TicketRepository } from '../repositories/ticket-repository.ts'
import { ArchiveTicket } from '../usecases/archive-ticket.ts'
import { CompleteTicket } from '../usecases/complete-ticket.ts'
import { CreateTicket } from '../usecases/create-ticket.ts'
import { DeleteTicket } from '../usecases/delete-ticket.ts'
import { GetAllTickets } from '../usecases/get-all-tickets.ts'
import { GetTicketById } from '../usecases/get-ticket-by-id.ts'
import { SearchTickets } from '../usecases/search-tickets.ts'
import { StartTicketProgress } from '../usecases/start-ticket-progress.ts'
import { UpdateTicket } from '../usecases/update-ticket.ts'
import { UpdateTicketDescription } from '../usecases/update-ticket-description.ts'
import { UpdateTicketPriority } from '../usecases/update-ticket-priority.ts'
import { UpdateTicketStatus } from '../usecases/update-ticket-status.ts'
import { UpdateTicketTitle } from '../usecases/update-ticket-title.ts'

/**
 * Factory for creating use cases with injected dependencies
 * This class follows the Abstract Factory pattern and provides
 * a clean interface for creating use cases without exposing infrastructure
 */
export class UseCaseFactory {
  constructor(private readonly ticketRepository: TicketRepository) {}

  // Namespace-based use cases
  createCreateTicketUseCase(): CreateTicket.UseCase {
    return new CreateTicket.UseCase(this.ticketRepository)
  }

  createGetTicketByIdUseCase(): GetTicketById.UseCase {
    return new GetTicketById.UseCase(this.ticketRepository)
  }

  createGetAllTicketsUseCase(): GetAllTickets.UseCase {
    return new GetAllTickets.UseCase(this.ticketRepository)
  }

  // Namespace pattern use cases
  createArchiveTicketUseCase(): ArchiveTicket.UseCase {
    return new ArchiveTicket.UseCase(this.ticketRepository)
  }

  createCompleteTicketUseCase(): CompleteTicket.UseCase {
    return new CompleteTicket.UseCase(this.ticketRepository)
  }

  createDeleteTicketUseCase(): DeleteTicket.UseCase {
    return new DeleteTicket.UseCase(this.ticketRepository)
  }

  createSearchTicketsUseCase(): SearchTickets.UseCase {
    return new SearchTickets.UseCase(this.ticketRepository)
  }

  createStartTicketProgressUseCase(): StartTicketProgress.UseCase {
    return new StartTicketProgress.UseCase(this.ticketRepository)
  }

  createUpdateTicketUseCase(): UpdateTicket.UseCase {
    return new UpdateTicket.UseCase(this.ticketRepository)
  }

  createUpdateTicketDescriptionUseCase(): UpdateTicketDescription.UseCase {
    return new UpdateTicketDescription.UseCase(this.ticketRepository)
  }

  createUpdateTicketPriorityUseCase(): UpdateTicketPriority.UseCase {
    return new UpdateTicketPriority.UseCase(this.ticketRepository)
  }

  createUpdateTicketStatusUseCase(): UpdateTicketStatus.UseCase {
    return new UpdateTicketStatus.UseCase(this.ticketRepository)
  }

  createUpdateTicketTitleUseCase(): UpdateTicketTitle.UseCase {
    return new UpdateTicketTitle.UseCase(this.ticketRepository)
  }

  /**
   * Get the ticket repository instance
   * For advanced usage where direct repository access is needed
   */
  getTicketRepository(): TicketRepository {
    return this.ticketRepository
  }
}
