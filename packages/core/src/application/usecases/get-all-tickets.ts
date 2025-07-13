import type { UseCase } from '../common/base-usecase.ts'
import { GetAllTicketsRequest } from '../dtos/requests/get-all-tickets.ts'
import { GetAllTicketsResponse } from '../dtos/responses/get-all-tickets.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

/**
 * Use case for retrieving all tickets with optional filtering.
 */
export class GetAllTicketsUseCase implements UseCase<GetAllTicketsRequest, GetAllTicketsResponse> {
  constructor(private readonly ticketRepository: TicketRepository) {}

  async execute(request: GetAllTicketsRequest): Promise<GetAllTicketsResponse> {
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

    return GetAllTicketsResponse.fromTickets(filteredTickets)
  }
}
