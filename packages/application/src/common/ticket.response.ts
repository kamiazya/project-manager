import type { Ticket } from '@project-manager/domain'

/**
 * Standard ticket response DTO used across multiple use cases
 */
export class TicketResponse {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly status: string,
    public readonly priority: string,
    public readonly type: string,
    public readonly createdAt: string,
    public readonly updatedAt: string
  ) {}

  static fromTicket(ticket: Ticket): TicketResponse {
    return new TicketResponse(
      ticket.id.value,
      ticket.title.value,
      ticket.description.value,
      ticket.status,
      ticket.priority,
      ticket.type,
      ticket.createdAt.toISOString(),
      ticket.updatedAt.toISOString()
    )
  }
}
