import type { Ticket, TicketId } from '@project-manager/domain'
import type { TicketStatistics } from '../common/ticket-statistics.ts'

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
