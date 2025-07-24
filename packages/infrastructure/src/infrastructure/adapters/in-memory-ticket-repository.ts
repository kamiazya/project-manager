import type { TicketQueryCriteria, TicketRepository } from '@project-manager/application'
import { Ticket, type TicketId } from '@project-manager/domain'

/**
 * In-memory implementation of the ticket repository.
 * Optimized for testing and development environments where persistence is not required.
 *
 * Features:
 * - High performance (no I/O operations)
 * - Perfect for unit tests and integration tests
 * - Supports all TicketRepository operations
 * - Includes helper methods for testing
 */
export class InMemoryTicketRepository implements TicketRepository {
  private tickets = new Map<string, Ticket>()

  async save(ticket: Ticket): Promise<void> {
    this.tickets.set(ticket.id.value, ticket)
  }

  async findById(id: TicketId): Promise<Ticket | null> {
    return this.tickets.get(id.value) || null
  }

  async queryTickets(criteria: TicketQueryCriteria = {}): Promise<Ticket[]> {
    let results = Array.from(this.tickets.values())

    // Apply filters
    if (criteria.status) {
      results = results.filter(ticket => ticket.status === criteria.status)
    }

    if (criteria.priority) {
      results = results.filter(ticket => ticket.priority === criteria.priority)
    }

    if (criteria.type) {
      results = results.filter(ticket => ticket.type === criteria.type)
    }

    // Text search in title and description
    if (criteria.search && criteria.search.trim() !== '') {
      const searchLower = criteria.search.toLowerCase()
      const searchIn = criteria.searchIn || ['title', 'description']

      results = results.filter(ticket => {
        let hasMatch = false

        if (searchIn.includes('title')) {
          hasMatch = hasMatch || ticket.title.value.toLowerCase().includes(searchLower)
        }

        if (searchIn.includes('description') && ticket.description) {
          hasMatch = hasMatch || ticket.description.value.toLowerCase().includes(searchLower)
        }

        return hasMatch
      })
    }

    // Apply pagination
    if (criteria.offset) {
      results = results.slice(criteria.offset)
    }

    if (criteria.limit) {
      results = results.slice(0, criteria.limit)
    }

    return results
  }

  async delete(id: TicketId): Promise<void> {
    this.tickets.delete(id.value)
  }

  /**
   * Test helper methods
   */

  /**
   * Clear all tickets from memory
   * Useful for test cleanup
   */
  clear(): void {
    this.tickets.clear()
  }

  /**
   * Get the number of tickets in memory
   * Useful for test assertions
   */
  size(): number {
    return this.tickets.size
  }

  /**
   * Get all tickets as an array
   * Useful for test verification
   */
  getAll(): Ticket[] {
    return Array.from(this.tickets.values())
  }

  /**
   * Check if a ticket exists by ID
   * Useful for test assertions
   */
  has(id: TicketId): boolean {
    return this.tickets.has(id.value)
  }
}
