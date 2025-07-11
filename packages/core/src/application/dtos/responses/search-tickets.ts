import type { Ticket } from '../../../domain/entities/ticket.js'
import { TicketSummary } from './get-all-tickets.js'

export class SearchTicketsResponse {
  constructor(
    public readonly tickets: TicketSummary[],
    public readonly totalCount: number
  ) {}

  static fromTickets(tickets: Ticket[]): SearchTicketsResponse {
    return new SearchTicketsResponse(
      tickets.map(ticket => TicketSummary.fromTicket(ticket)),
      tickets.length
    )
  }
}
