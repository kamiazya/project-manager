import type { TicketJSON } from '@project-manager/shared'
import { type ReconstituteTicketData, Ticket } from '../../../domain/entities/ticket.ts'

/**
 * Convert a domain Ticket to persistence format (JSON)
 */
export function toPersistence(ticket: Ticket): TicketJSON {
  return {
    id: ticket.id.value,
    title: ticket.title.value,
    description: ticket.description.value,
    status: ticket.status.value,
    priority: ticket.priority.value,
    type: ticket.type,
    privacy: ticket.privacy,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  }
}

/**
 * Convert persistence format (JSON) to domain Ticket
 */
export function toDomain(json: TicketJSON): Ticket {
  const data: ReconstituteTicketData = {
    id: json.id,
    title: json.title,
    description: json.description,
    status: json.status,
    priority: json.priority,
    type: json.type,
    privacy: json.privacy,
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
  }

  return Ticket.reconstitute(data)
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
