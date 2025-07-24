import type { Ticket, TicketId } from '@project-manager/domain'

/**
 * Unified criteria for querying and searching tickets
 * Supports both basic filtering and text-based search
 */
export interface TicketQueryCriteria {
  status?: string
  priority?: string
  type?: string
  search?: string
  searchIn?: string[]
  limit?: number
  offset?: number
}

/**
 * Repository interface for Ticket aggregate
 * Uses domain objects (value objects) instead of primitives
 */
export interface TicketRepository {
  save(ticket: Ticket): void
  findById(id: TicketId): Promise<Ticket | null>
  queryTickets(criteria: TicketQueryCriteria): Promise<Ticket[]>
  delete(id: TicketId): void
}
