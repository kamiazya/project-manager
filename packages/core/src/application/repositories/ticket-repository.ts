import type { Ticket } from '../../domain/entities/ticket.ts'
import type { TicketId } from '../../domain/value-objects/ticket-id.ts'
import type { TicketStatistics } from '../dtos/ticket-statistics.ts'

/**
 * Repository interface for Ticket aggregate
 * Uses domain objects (value objects) instead of primitives
 */
export interface TicketRepository {
  save(ticket: Ticket): Promise<void>
  findById(id: TicketId): Promise<Ticket | null>
  findAll(): Promise<Ticket[]>
  delete(id: TicketId): Promise<void>
  getStatistics(): Promise<TicketStatistics>
}

export const TicketRepository = Symbol('TicketRepository')
