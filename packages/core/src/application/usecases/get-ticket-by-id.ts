import { TicketId } from '../../domain/value-objects/ticket-id.js'
import type { UseCase } from '../common/base-usecase.js'
import { GetTicketByIdRequest } from '../dtos/requests/get-ticket-by-id.js'
import { GetTicketByIdResponse } from '../dtos/responses/get-ticket-by-id.js'
import { TicketResponse } from '../dtos/responses/ticket.js'
import type { TicketRepository } from '../repositories/ticket-repository.js'

/**
 * Use case for retrieving a ticket by its ID.
 * Returns null if ticket is not found.
 */
export class GetTicketByIdUseCase
  implements UseCase<GetTicketByIdRequest, GetTicketByIdResponse | null>
{
  constructor(private readonly ticketRepository: TicketRepository) {}

  async execute(request: GetTicketByIdRequest): Promise<GetTicketByIdResponse | null> {
    const ticketId = TicketId.create(request.id)
    const ticket = await this.ticketRepository.findById(ticketId)

    if (!ticket) {
      return null
    }

    return TicketResponse.fromTicket(ticket) as GetTicketByIdResponse
  }
}
