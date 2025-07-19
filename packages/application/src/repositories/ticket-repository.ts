import type { Ticket, TicketId } from '@project-manager/domain'

/**
 * Filters for querying tickets at repository level
 */
export interface TicketQueryFilters {
  status?: string
  priority?: string
  type?: string
  limit?: number
  offset?: number
}

/**
 * Search criteria for text-based ticket search
 */
export interface TicketSearchCriteria {
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
  save(ticket: Ticket): Promise<void>
  findById(id: TicketId): Promise<Ticket | null>
  findAll(): Promise<Ticket[]>
  findAllWithFilters(filters: TicketQueryFilters): Promise<Ticket[]>
  searchTickets(criteria: TicketSearchCriteria): Promise<Ticket[]>
  delete(id: TicketId): Promise<void>
}

export const TicketRepository = Symbol('TicketRepository')
