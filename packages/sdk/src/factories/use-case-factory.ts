/**
 * Factory for creating use cases with proper dependency injection
 * This provides a Clean Architecture compliant way to access use cases
 * without exposing infrastructure layer details
 */

import type { TicketRepository } from '@project-manager/application'
import {
  CreateTicket,
  DeleteTicket,
  GetTicketById,
  SearchTickets,
  UpdateTicketContent,
  UpdateTicketPriority,
  UpdateTicketStatus,
  UpdateTicketTitle,
} from '@project-manager/application'

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

  // Namespace pattern use cases
  createDeleteTicketUseCase(): DeleteTicket.UseCase {
    return new DeleteTicket.UseCase(this.ticketRepository)
  }

  createSearchTicketsUseCase(): SearchTickets.UseCase {
    return new SearchTickets.UseCase(this.ticketRepository)
  }

  createUpdateTicketContentUseCase(): UpdateTicketContent.UseCase {
    return new UpdateTicketContent.UseCase(this.ticketRepository)
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
