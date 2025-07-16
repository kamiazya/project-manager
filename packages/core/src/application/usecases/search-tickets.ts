import type { Ticket } from '../../domain/entities/ticket.ts'
import type { UseCase } from '../common/base-usecase.ts'
import { TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

// Temporary compatibility classes until namespace conversion
interface SearchCriteria {
  status?: string
  priority?: string
  type?: string
  privacy?: string
  search?: string
  searchIn?: string[]
}

class SearchTicketsRequest {
  constructor(public readonly criteria: SearchCriteria) {}
}

class SearchTicketsResponse {
  constructor(public readonly tickets: TicketResponse[]) {}

  static fromTickets(tickets: Ticket[]): SearchTicketsResponse {
    return new SearchTicketsResponse(tickets.map(ticket => TicketResponse.fromTicket(ticket)))
  }
}

/**
 * Use case for searching tickets by criteria.
 */
export class SearchTicketsUseCase implements UseCase<SearchTicketsRequest, SearchTicketsResponse> {
  constructor(private readonly ticketRepository: TicketRepository) {}

  async execute(request: SearchTicketsRequest): Promise<SearchTicketsResponse> {
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

    return SearchTicketsResponse.fromTickets(filteredTickets)
  }
}
