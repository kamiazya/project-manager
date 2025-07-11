import type { TicketSearchCriteria, TicketStats } from '@project-manager/shared'
import { inject, injectable } from 'inversify'
import { TYPES } from '../container/types.js'
import { type CreateTicketData, Ticket } from '../entities/ticket.js'
import type { TicketRepository } from '../repositories/ticket-repository.interface.js'
import { TicketId } from '../value-objects/index.js'

/**
 * Use case implementation for ticket operations following DDD principles.
 * This class implements the application layer logic for ticket management,
 * orchestrating interactions between the domain entities and repositories.
 *
 * Following Clean Architecture and DDD principles:
 * - Contains application-specific business rules
 * - Orchestrates flow of data to/from entities
 * - Uses domain objects (entities, value objects) throughout
 * - Depends only on abstractions (interfaces), not concretions
 */
@injectable()
export class TicketUseCase {
  constructor(
    @inject(TYPES.TicketRepository)
    private readonly ticketRepository: TicketRepository
  ) {}

  /**
   * Creates a new ticket with the provided data.
   * Uses the domain entity factory method for proper instantiation.
   */
  async createTicket(ticketData: CreateTicketData): Promise<Ticket> {
    // Use domain entity factory method
    const ticket = Ticket.create(ticketData)

    // Persist through repository
    await this.ticketRepository.save(ticket)

    return ticket
  }

  /**
   * Retrieves a ticket by its ID.
   */
  async getTicketById(id: string): Promise<Ticket | null> {
    const ticketId = TicketId.create(id)
    return await this.ticketRepository.findById(ticketId)
  }

  /**
   * Retrieves all tickets.
   */
  async getAllTickets(): Promise<Ticket[]> {
    return await this.ticketRepository.findAll()
  }

  /**
   * Updates a ticket's title.
   */
  async updateTicketTitle(id: string, newTitle: string): Promise<Ticket> {
    const ticketId = TicketId.create(id)
    const ticket = await this.ticketRepository.findById(ticketId)

    if (!ticket) {
      throw new Error(`Ticket not found: ${id}`)
    }

    // Use domain method for business logic
    ticket.updateTitle(newTitle)

    await this.ticketRepository.save(ticket)
    return ticket
  }

  /**
   * Updates a ticket's description.
   */
  async updateTicketDescription(id: string, newDescription: string): Promise<Ticket> {
    const ticketId = TicketId.create(id)
    const ticket = await this.ticketRepository.findById(ticketId)

    if (!ticket) {
      throw new Error(`Ticket not found: ${id}`)
    }

    // Use domain method for business logic
    ticket.updateDescription(newDescription)

    await this.ticketRepository.save(ticket)
    return ticket
  }

  /**
   * Changes a ticket's status.
   */
  async updateTicketStatus(
    id: string,
    newStatus: 'pending' | 'in_progress' | 'completed' | 'archived'
  ): Promise<Ticket> {
    const ticketId = TicketId.create(id)
    const ticket = await this.ticketRepository.findById(ticketId)

    if (!ticket) {
      throw new Error(`Ticket not found: ${id}`)
    }

    // Use domain method for business logic (includes validation)
    ticket.changeStatus(newStatus)

    await this.ticketRepository.save(ticket)
    return ticket
  }

  /**
   * Changes a ticket's priority.
   */
  async updateTicketPriority(id: string, newPriority: 'high' | 'medium' | 'low'): Promise<Ticket> {
    const ticketId = TicketId.create(id)
    const ticket = await this.ticketRepository.findById(ticketId)

    if (!ticket) {
      throw new Error(`Ticket not found: ${id}`)
    }

    // Use domain method for business logic
    ticket.changePriority(newPriority)

    await this.ticketRepository.save(ticket)
    return ticket
  }

  /**
   * Starts progress on a ticket.
   */
  async startTicketProgress(id: string): Promise<Ticket> {
    const ticketId = TicketId.create(id)
    const ticket = await this.ticketRepository.findById(ticketId)

    if (!ticket) {
      throw new Error(`Ticket not found: ${id}`)
    }

    // Use domain business operation
    ticket.startProgress()

    await this.ticketRepository.save(ticket)
    return ticket
  }

  /**
   * Completes a ticket.
   */
  async completeTicket(id: string): Promise<Ticket> {
    const ticketId = TicketId.create(id)
    const ticket = await this.ticketRepository.findById(ticketId)

    if (!ticket) {
      throw new Error(`Ticket not found: ${id}`)
    }

    // Use domain business operation
    ticket.complete()

    await this.ticketRepository.save(ticket)
    return ticket
  }

  /**
   * Archives a ticket.
   */
  async archiveTicket(id: string): Promise<Ticket> {
    const ticketId = TicketId.create(id)
    const ticket = await this.ticketRepository.findById(ticketId)

    if (!ticket) {
      throw new Error(`Ticket not found: ${id}`)
    }

    // Use domain business operation
    ticket.archive()

    await this.ticketRepository.save(ticket)
    return ticket
  }

  /**
   * Deletes a ticket by ID.
   */
  async deleteTicket(id: string): Promise<void> {
    const ticketId = TicketId.create(id)
    await this.ticketRepository.delete(ticketId)
  }

  /**
   * Gets ticket statistics.
   */
  async getTicketStats(): Promise<TicketStats> {
    const tickets = await this.ticketRepository.findAll()

    const stats: TicketStats = {
      total: tickets.length,
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

    for (const ticket of tickets) {
      // Count by status
      switch (ticket.status.value) {
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
      switch (ticket.priority.value) {
        case 'high':
          stats.byPriority.high++
          break
        case 'medium':
          stats.byPriority.medium++
          break
        case 'low':
          stats.byPriority.low++
          break
      }

      // Count by type
      switch (ticket.type) {
        case 'feature':
          stats.byType.feature++
          break
        case 'bug':
          stats.byType.bug++
          break
        case 'task':
          stats.byType.task++
          break
      }
    }

    return stats
  }

  /**
   * Searches tickets by criteria.
   */
  async searchTickets(criteria: TicketSearchCriteria): Promise<Ticket[]> {
    const tickets = await this.ticketRepository.findAll()

    return tickets.filter(ticket => {
      // Filter by status
      if (criteria.status && ticket.status.value !== criteria.status) {
        return false
      }

      // Filter by priority
      if (criteria.priority && ticket.priority.value !== criteria.priority) {
        return false
      }

      // Filter by type
      if (criteria.type && ticket.type !== criteria.type) {
        return false
      }

      // Filter by privacy
      if (criteria.privacy && ticket.privacy !== criteria.privacy) {
        return false
      }

      // Filter by text search in title/description
      if ('search' in criteria && criteria.search && typeof criteria.search === 'string') {
        const searchLower = criteria.search.toLowerCase()
        const titleMatch = ticket.title.value.toLowerCase().includes(searchLower)
        const descriptionMatch = ticket.description.value.toLowerCase().includes(searchLower)

        if (!titleMatch && !descriptionMatch) {
          return false
        }
      }

      return true
    })
  }
}
