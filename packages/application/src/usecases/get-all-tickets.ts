import type { Ticket } from '@project-manager/domain'
import type { UseCase as IUseCase } from '../common/base-usecase.ts'
import { createTicketResponse, type TicketResponse } from '../common/ticket.response.ts'
import type { TicketQueryFilters, TicketRepository } from '../repositories/ticket-repository.ts'

export namespace GetAllTickets {
  /**
   * Filters for querying tickets
   */
  export interface Filters {
    status?: string
    priority?: string
    type?: string
    limit?: number
  }

  /**
   * Request DTO for getting all tickets with optional filtering
   */
  export interface Request {
    readonly filters?: Filters
  }

  /**
   * Response DTO for ticket list
   */
  export class Response {
    constructor(public readonly tickets: TicketResponse[]) {}

    static fromTickets(tickets: Ticket[]): Response {
      return new Response(tickets.map(ticket => createTicketResponse(ticket)))
    }
  }

  /**
   * Use case for retrieving all tickets with optional filtering.
   */
  export class UseCase implements IUseCase<Request, Response> {
    constructor(private readonly ticketRepository: TicketRepository) {}

    async execute(request: Request): Promise<Response> {
      const filters = request.filters || {}

      // Check if any filters are provided
      const hasFilters = filters.status || filters.priority || filters.type || filters.limit

      let tickets: Ticket[]

      if (hasFilters) {
        // Use repository-level filtering for better performance
        const queryFilters: TicketQueryFilters = {
          status: filters.status,
          priority: filters.priority,
          type: filters.type,
          limit: filters.limit,
        }
        tickets = await this.ticketRepository.findAllWithFilters(queryFilters)
      } else {
        // No filters, get all tickets
        tickets = await this.ticketRepository.findAll()
      }

      return Response.fromTickets(tickets)
    }
  }
}
