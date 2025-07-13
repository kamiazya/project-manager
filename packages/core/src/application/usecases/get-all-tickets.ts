import type { UseCase } from '../common/base-usecase.js'
import { GetAllTicketsRequest } from '../dtos/requests/get-all-tickets.js'
import { GetAllTicketsResponse } from '../dtos/responses/get-all-tickets.js'
import type { TicketRepository } from '../repositories/ticket-repository.js'

/**
 * Use case for retrieving all tickets.
 */
export class GetAllTicketsUseCase implements UseCase<GetAllTicketsRequest, GetAllTicketsResponse> {
  constructor(private readonly ticketRepository: TicketRepository) {}

  async execute(_request: GetAllTicketsRequest): Promise<GetAllTicketsResponse> {
    const tickets = await this.ticketRepository.findAll()
    return GetAllTicketsResponse.fromTickets(tickets)
  }
}
