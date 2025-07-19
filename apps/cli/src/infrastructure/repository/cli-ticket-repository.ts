/**
 * CLI-specific ticket repository implementation
 * This implements the TicketRepository interface for CLI usage
 * Following Clean Architecture principles.
 *
 * This class is a Decorator for another TicketRepository. It wraps a concrete
 * repository implementation (like JsonTicketRepository) and can add
 * CLI-specific behaviors (e.g., logging) while delegating the core
 * persistence logic.
 */

import type {
  Ticket,
  TicketId,
  TicketQueryFilters,
  TicketRepository,
  TicketSearchCriteria,
} from '@project-manager/application'

/**
 * CLI-specific implementation of TicketRepository.
 * Acts as a decorator, wrapping another repository to provide a separation
 * of concerns for the CLI interface.
 */
export class CliTicketRepository implements TicketRepository {
  private readonly innerRepository: TicketRepository

  /**
   * Constructs a new CliTicketRepository.
   * @param repository The concrete TicketRepository instance to wrap.
   */
  constructor(repository: TicketRepository) {
    this.innerRepository = repository
  }

  /**
   * Saves a ticket by delegating to the inner repository.
   * Can be extended to add CLI-specific logging.
   */
  async save(ticket: Ticket): Promise<void> {
    // Example of CLI-specific behavior:
    // console.log(`[CLI] Saving ticket: ${ticket.title.value}`);
    await this.innerRepository.save(ticket)
  }

  /**
   * Finds a ticket by ID by delegating to the inner repository.
   */
  async findById(id: TicketId): Promise<Ticket | null> {
    return this.innerRepository.findById(id)
  }

  /**
   * Finds all tickets by delegating to the inner repository.
   */
  async findAll(): Promise<Ticket[]> {
    return this.innerRepository.findAll()
  }

  /**
   * Finds all tickets with filters by delegating to the inner repository.
   */
  async findAllWithFilters(filters: TicketQueryFilters): Promise<Ticket[]> {
    return this.innerRepository.findAllWithFilters(filters)
  }

  /**
   * Deletes a ticket by ID by delegating to the inner repository.
   */
  async delete(id: TicketId): Promise<void> {
    await this.innerRepository.delete(id)
  }

  /**
   * Searches tickets by delegating to the inner repository.
   */
  async searchTickets(criteria: TicketSearchCriteria): Promise<Ticket[]> {
    return this.innerRepository.searchTickets(criteria)
  }
}
