import { Ticket } from '@project-manager/domain'
import type { TicketJSON } from '../../types/persistence-types.ts'

/**
 * Convert a domain Ticket to persistence format (JSON)
 */
export function toPersistence(ticket: Ticket): TicketJSON {
  return {
    id: ticket.id.value,
    title: ticket.title.value,
    description: ticket.description?.value,
    status: ticket.status,
    priority: ticket.priority,
    type: ticket.type,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  }
}

/**
 * Convert persistence format (JSON) to domain Ticket
 */
export function toDomain(json: TicketJSON): Ticket {
  return Ticket.reconstitute({
    id: json.id,
    title: json.title,
    description: json.description,
    status: json.status,
    priority: json.priority,
    type: json.type,
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
  })
}

/**
 * Convert an array of persistence format to domain objects
 */
export function toDomainList(jsonList: TicketJSON[]): Ticket[] {
  return jsonList.map(json => toDomain(json))
}

/**
 * Convert an array of domain objects to persistence format
 */
export function toPersistenceList(tickets: Ticket[]): TicketJSON[] {
  return tickets.map(ticket => toPersistence(ticket))
}
