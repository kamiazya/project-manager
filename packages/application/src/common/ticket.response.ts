import type { Ticket } from '@project-manager/domain'

/**
 * Standard ticket response interface for data transfer
 */
export interface TicketResponse {
  readonly id: string
  readonly title: string
  readonly status: string
  readonly priority: string
  readonly type: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly description?: string
}

/**
 * Factory function to create TicketResponse from domain entity
 */
export function createTicketResponse(ticket: Ticket): TicketResponse {
  return {
    id: ticket.id.value,
    title: ticket.title.value,
    status: ticket.status,
    priority: ticket.priority,
    type: ticket.type,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    description: ticket.description?.value,
  }
}
