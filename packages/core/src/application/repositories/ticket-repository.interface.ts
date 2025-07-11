import type { Ticket } from '../../domain/entities/ticket.js'
import type { TicketId } from '../../domain/value-objects/index.js'

/**
 * Repository interface for Ticket aggregate
 * Uses domain objects (value objects) instead of primitives
 */
export interface TicketRepository {
  save(ticket: Ticket): Promise<void>
  findById(id: TicketId): Promise<Ticket | null>
  findAll(): Promise<Ticket[]>
  delete(id: TicketId): Promise<void>
}

export const TicketRepository = Symbol('TicketRepository')
