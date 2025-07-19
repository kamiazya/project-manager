import type { Ticket } from '@project-manager/domain'
import type { UseCase as IUseCase } from '../common/base-usecase.ts'
import { TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository, TicketSearchCriteria } from '../repositories/ticket-repository.ts'

export namespace SearchTickets {
  /**
   * Search criteria for finding tickets
   */
  export interface SearchCriteria {
    status?: string
    priority?: string
    type?: string
    search?: string
    searchIn?: string[]
  }

  /**
   * Request DTO for searching tickets
   */
  export class Request {
    constructor(public readonly criteria: SearchCriteria) {}
  }

  /**
   * Response DTO for search results
   */
  export class Response {
    constructor(public readonly tickets: TicketResponse[]) {}

    static fromTickets(tickets: Ticket[]): Response {
      return new Response(tickets.map(ticket => TicketResponse.fromTicket(ticket)))
    }
  }

  /**
   * Use case for searching tickets by criteria.
   */
  export class UseCase implements IUseCase<Request, Response> {
    constructor(private readonly ticketRepository: TicketRepository) {}

    async execute(request: Request): Promise<Response> {
      const { criteria } = request

      // Convert UseCase SearchCriteria to Repository TicketSearchCriteria
      const searchCriteria: TicketSearchCriteria = {
        status: criteria.status as any,
        priority: criteria.priority as any,
        type: criteria.type as any,
        search: criteria.search,
        searchIn: criteria.searchIn as ('title' | 'description')[],
      }

      // Use repository-level search for better performance
      const tickets = await this.ticketRepository.searchTickets(searchCriteria)

      return Response.fromTickets(tickets)
    }
  }
}
