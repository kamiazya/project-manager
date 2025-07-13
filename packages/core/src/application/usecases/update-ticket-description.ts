import { ERROR_MESSAGES, TicketNotFoundError } from '@project-manager/shared'
import { TicketId } from '../../domain/value-objects/ticket-id.ts'
import type { UseCase } from '../common/base-usecase.ts'
import { UpdateTicketDescriptionRequest } from '../dtos/requests/update-ticket-description.ts'
import { TicketResponse } from '../dtos/responses/ticket.ts'
import { UpdateTicketDescriptionResponse } from '../dtos/responses/update-ticket-description.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

/**
 * Use case for updating a ticket's description.
 */
export class UpdateTicketDescriptionUseCase
  implements UseCase<UpdateTicketDescriptionRequest, UpdateTicketDescriptionResponse>
{
  constructor(private readonly ticketRepository: TicketRepository) {}

  async execute(request: UpdateTicketDescriptionRequest): Promise<UpdateTicketDescriptionResponse> {
    const ticketId = TicketId.create(request.id)
    const ticket = await this.ticketRepository.findById(ticketId)

    if (!ticket) {
      throw new TicketNotFoundError(ERROR_MESSAGES.TICKET_NOT_FOUND(request.id))
    }

    // Use domain method for business logic
    ticket.updateDescription(request.newDescription)

    await this.ticketRepository.save(ticket)
    return TicketResponse.fromTicket(ticket) as UpdateTicketDescriptionResponse
  }
}
