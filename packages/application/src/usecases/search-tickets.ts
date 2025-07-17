import type { Ticket } from '@project-manager/domain'
import type { UseCase as IUseCase } from '../common/base-usecase.ts'
import { TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

export namespace SearchTickets {
  /**
   * Search criteria for finding tickets
   */
  export interface SearchCriteria {
    status?: string
    priority?: string
    type?: string
    privacy?: string
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
      const tickets = await this.ticketRepository.findAll()
      const { criteria } = request

      const filteredTickets = tickets.filter(ticket => {
        // Filter by status
        if (criteria.status && ticket.status.value !== criteria.status) {
          return false
        }

        // Filter by priority
        if (criteria.priority && ticket.priority.value !== criteria.priority) {
          return false
        }

        // Filter by type
        if (criteria.type && ticket.type !== criteria.type) {
          return false
        }

        // Filter by privacy
        if (criteria.privacy && ticket.privacy !== criteria.privacy) {
          return false
        }

        // Filter by text search in title/description
        if ('search' in criteria && criteria.search && typeof criteria.search === 'string') {
          const searchLower = criteria.search.toLowerCase()
          const searchIn = criteria.searchIn || ['title', 'description'] // Default to both fields

          let hasMatch = false

          // Check title if included in searchIn
          if (searchIn.includes('title')) {
            const titleMatch = ticket.title.value.toLowerCase().includes(searchLower)
            if (titleMatch) hasMatch = true
          }

          // Check description if included in searchIn
          if (searchIn.includes('description')) {
            const descriptionMatch = ticket.description.value.toLowerCase().includes(searchLower)
            if (descriptionMatch) hasMatch = true
          }

          if (!hasMatch) {
            return false
          }
        }

        return true
      })

      return Response.fromTickets(filteredTickets)
    }
  }
}
