import { inject, injectable } from 'inversify'
import type { UseCase } from '../common/base-usecase.js'
import { SearchTicketsRequest } from '../dtos/requests/search-tickets.js'
import { SearchTicketsResponse } from '../dtos/responses/search-tickets.js'
import {
  type TicketRepository,
  TicketRepository as TicketRepositorySymbol,
} from '../repositories/ticket-repository.js'

/**
 * Use case for searching tickets by criteria.
 */
@injectable()
export class SearchTicketsUseCase implements UseCase<SearchTicketsRequest, SearchTicketsResponse> {
  constructor(
    @inject(TicketRepositorySymbol)
    private readonly ticketRepository: TicketRepository
  ) {}

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
        const titleMatch = ticket.title.value.toLowerCase().includes(searchLower)
        const descriptionMatch = ticket.description.value.toLowerCase().includes(searchLower)

        if (!titleMatch && !descriptionMatch) {
          return false
        }
      }

      return true
    })

    return SearchTicketsResponse.fromTickets(filteredTickets)
  }
}
