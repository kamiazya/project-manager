import type { Ticket } from '../../../domain/entities/ticket.js'

export class TicketSummary {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly status: string,
    public readonly priority: string,
    public readonly type: string,
    public readonly createdAt: string,
    public readonly updatedAt: string
  ) {}

  static fromTicket(ticket: Ticket): TicketSummary {
    return new TicketSummary(
      ticket.id.value,
      ticket.title.value,
      ticket.status.value,
      ticket.priority.value,
      ticket.type,
      ticket.createdAt.toISOString(),
      ticket.updatedAt.toISOString()
    )
  }
}

export class GetAllTicketsResponse {
  constructor(public readonly tickets: TicketSummary[]) {}

  static fromTickets(tickets: Ticket[]): GetAllTicketsResponse {
    return new GetAllTicketsResponse(tickets.map(ticket => TicketSummary.fromTicket(ticket)))
  }
}
