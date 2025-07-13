import { TicketId } from '../../domain/value-objects/ticket-id.ts'
import type { UseCase } from '../common/base-usecase.ts'
import { GetTicketByIdRequest } from '../dtos/requests/get-ticket-by-id.ts'
import { GetTicketByIdResponse } from '../dtos/responses/get-ticket-by-id.ts'
import { TicketResponse } from '../dtos/responses/ticket.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

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
