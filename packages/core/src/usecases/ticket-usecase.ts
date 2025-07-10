import type {
  TicketData,
  TicketPriority,
  TicketSearchCriteria,
  TicketStats,
  TicketStatus,
} from '@project-manager/shared'
import { inject, injectable } from 'inversify'
import { TYPES } from '../container/types.js'
import { Ticket } from '../entities/ticket.js'
import type { ITicketRepository } from '../ports/ticket-repository.js'

/**
 * Use case implementation for ticket operations.
 * This class implements the application layer logic for ticket management,
 * orchestrating interactions between the domain entities and repositories.
 *
 * Following Clean Architecture principles:
 * - Contains application-specific business rules
 * - Orchestrates flow of data to/from entities
 * - Independent of UI, database, and external frameworks
 * - Depends only on abstractions (interfaces), not concretions
 *
 * The use case layer is where the application's business logic resides,
 * separate from the pure domain logic in entities.
 */
@injectable()
export class TicketUseCase {
  constructor(
    @inject(TYPES.TicketRepository)
    private readonly ticketRepository: ITicketRepository
  ) {}

  /**
   * Creates a new ticket with the provided data.
   *
   * Business rules applied:
   * - Validates ticket data through entity constructor
   * - Assigns default values for optional fields
   * - Generates unique ID
   * - Persists to repository
   *
   * @param ticketData - The data for creating the ticket
   * @returns The created ticket entity
   * @throws {TicketValidationError} When ticket data is invalid
   * @throws {StorageError} When persistence fails
   */
  async createTicket(ticketData: TicketData): Promise<Ticket> {
    // Domain entity validates data and applies business rules
    const ticket = new Ticket(ticketData)

    // Persist through repository abstraction
    await this.ticketRepository.save(ticket)

    return ticket
  }

  /**
   * Retrieves a ticket by its ID.
   *
   * @param id - The unique identifier of the ticket
   * @returns The ticket entity
   * @throws {TicketNotFoundError} When the ticket doesn't exist
   * @throws {ValidationError} When the ID format is invalid
   */
  async getTicket(id: string): Promise<Ticket> {
    return await this.ticketRepository.findById(id)
  }

  /**
   * Updates the status of an existing ticket.
   *
   * Business rules applied:
   * - Validates ticket exists
   * - Updates timestamp through entity method
   * - Persists changes
   *
   * @param id - The unique identifier of the ticket
   * @param status - The new status to assign
   * @returns The updated ticket entity
   * @throws {TicketNotFoundError} When the ticket doesn't exist
   * @throws {StorageError} When persistence fails
   */
  async updateTicketStatus(id: string, status: TicketStatus): Promise<Ticket> {
    const ticket = await this.ticketRepository.findById(id)

    // Apply business rule through domain entity
    ticket.updateStatus(status)

    // Persist changes
    await this.ticketRepository.update(ticket)

    return ticket
  }

  /**
   * Updates the priority of an existing ticket.
   *
   * Business rules applied:
   * - Validates ticket exists
   * - Updates timestamp through entity method
   * - Persists changes
   *
   * @param id - The unique identifier of the ticket
   * @param priority - The new priority to assign
   * @returns The updated ticket entity
   * @throws {TicketNotFoundError} When the ticket doesn't exist
   * @throws {StorageError} When persistence fails
   */
  async updateTicketPriority(id: string, priority: TicketPriority): Promise<Ticket> {
    const ticket = await this.ticketRepository.findById(id)

    // Apply business rule through domain entity
    ticket.updatePriority(priority)

    // Persist changes
    await this.ticketRepository.update(ticket)

    return ticket
  }

  /**
   * Deletes a ticket from the system.
   *
   * @param id - The unique identifier of the ticket to delete
   * @throws {TicketNotFoundError} When the ticket doesn't exist
   * @throws {StorageError} When deletion fails
   */
  async deleteTicket(id: string): Promise<void> {
    // Repository will validate existence and throw if not found
    await this.ticketRepository.delete(id)
  }

  /**
   * Lists tickets based on optional search criteria.
   *
   * @param criteria - Optional search criteria for filtering
   * @returns Array of tickets matching the criteria
   */
  async listTickets(criteria: TicketSearchCriteria = {}): Promise<Ticket[]> {
    // If no criteria provided, return all tickets
    if (Object.keys(criteria).length === 0) {
      return await this.ticketRepository.findAll()
    }

    // Otherwise, search with criteria
    return await this.ticketRepository.search(criteria)
  }

  /**
   * Calculates and returns statistics about tickets in the system.
   *
   * Business logic:
   * - Aggregates ticket counts by status, priority, and type
   * - Provides overview of system state
   *
   * @returns Comprehensive ticket statistics
   */
  async getTicketStats(): Promise<TicketStats> {
    const allTickets = await this.ticketRepository.findAll()

    // Initialize stats structure
    const stats: TicketStats = {
      total: allTickets.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
      archived: 0,
      byPriority: {
        high: 0,
        medium: 0,
        low: 0,
      },
      byType: {
        feature: 0,
        bug: 0,
        task: 0,
      },
    }

    // Calculate statistics
    for (const ticket of allTickets) {
      // Count by status
      switch (ticket.status) {
        case 'pending':
          stats.pending++
          break
        case 'in_progress':
          stats.inProgress++
          break
        case 'completed':
          stats.completed++
          break
        case 'archived':
          stats.archived++
          break
      }

      // Count by priority
      stats.byPriority[ticket.priority]++

      // Count by type
      stats.byType[ticket.type]++
    }

    return stats
  }
}
