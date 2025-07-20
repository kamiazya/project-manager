import type { Ticket } from '@project-manager/domain'
import type { UseCase as IUseCase } from '../common/base-usecase.ts'
import { createTicketResponse, type TicketResponse } from '../common/ticket.response.ts'
import type { TicketQueryCriteria, TicketRepository } from '../repositories/ticket-repository.ts'

export namespace SearchTickets {
  /**
   * Search and filter criteria for finding tickets
   * Supports both basic filtering and text-based search
   */
  export interface SearchCriteria {
    status?: string
    priority?: string
    type?: string
    search?: string
    searchIn?: string[]
    limit?: number
    offset?: number
  }

  /**
   * Request DTO for searching and filtering tickets
   */
  export interface Request {
    readonly criteria?: SearchCriteria
  }

  /**
   * Response DTO for search results
   */
  export class Response {
    constructor(public readonly tickets: TicketResponse[]) {}

    static fromTickets(tickets: Ticket[]): Response {
      return new Response(tickets.map(ticket => createTicketResponse(ticket)))
    }
  }

  /**
   * Use case for searching and filtering tickets.
   * Handles both text-based search and basic filtering.
   * If no criteria are provided, returns all tickets.
   */
  export class UseCase implements IUseCase<Request, Response> {
    constructor(private readonly ticketRepository: TicketRepository) {}

    async execute(request: Request): Promise<Response> {
      const criteria = request.criteria || {}

      // Convert to repository criteria format
      const queryCriteria: TicketQueryCriteria = {
        status: criteria.status,
        priority: criteria.priority,
        type: criteria.type,
        search: criteria.search,
        searchIn: criteria.searchIn,
        limit: criteria.limit,
        offset: criteria.offset,
      }

      const tickets = await this.ticketRepository.queryTickets(queryCriteria)
      return Response.fromTickets(tickets)
    }
  }
}
