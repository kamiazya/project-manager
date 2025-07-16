import type { Ticket } from '../../domain/entities/ticket.ts'
import type { UseCase as IUseCase } from '../common/base-usecase.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

export namespace GetAllTickets {
  /**
   * Filters for querying tickets
   */
  export interface Filters {
    status?: 'pending' | 'in_progress' | 'completed' | 'archived'
    priority?: 'high' | 'medium' | 'low'
    type?: 'feature' | 'bug' | 'task'
    limit?: number
  }

  /**
   * Request DTO for getting all tickets with optional filtering
   */
  export class Request {
    constructor(public readonly filters: Filters = {}) {}
  }

  /**
   * Summary representation of a ticket
   */
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

  /**
   * Response DTO for ticket list
   */
  export class Response {
    constructor(public readonly tickets: TicketSummary[]) {}

    static fromTickets(tickets: Ticket[]): Response {
      return new Response(tickets.map(ticket => TicketSummary.fromTicket(ticket)))
    }
  }

  /**
   * Use case for retrieving all tickets with optional filtering.
   */
  export class UseCase implements IUseCase<Request, Response> {
    constructor(private readonly ticketRepository: TicketRepository) {}

    async execute(request: Request): Promise<Response> {
      const tickets = await this.ticketRepository.findAll()
      const { filters } = request

      // Apply filters if provided
      let filteredTickets = tickets

      if (filters.status || filters.priority || filters.type) {
        filteredTickets = tickets.filter(ticket => {
          // Filter by status
          if (filters.status && ticket.status.value !== filters.status) {
            return false
          }

          // Filter by priority
          if (filters.priority && ticket.priority.value !== filters.priority) {
            return false
          }

          // Filter by type
          if (filters.type && ticket.type !== filters.type) {
            return false
          }

          return true
        })
      }

      // Apply limit if provided
      if (filters.limit && filters.limit > 0) {
        filteredTickets = filteredTickets.slice(0, filters.limit)
      }

      return Response.fromTickets(filteredTickets)
    }
  }
}
