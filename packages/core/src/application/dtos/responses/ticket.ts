import type { Ticket } from '../../../domain/entities/ticket.ts'

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
    public readonly privacy: string,
    public readonly createdAt: string,
    public readonly updatedAt: string
  ) {}

  static fromTicket(ticket: Ticket): TicketResponse {
    return new TicketResponse(
      ticket.id.value,
      ticket.title.value,
      ticket.description.value,
      ticket.status.value,
      ticket.priority.value,
      ticket.type,
      ticket.privacy,
      ticket.createdAt.toISOString(),
      ticket.updatedAt.toISOString()
    )
  }
}
