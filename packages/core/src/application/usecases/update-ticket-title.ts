import { ERROR_MESSAGES, TicketNotFoundError } from '@project-manager/shared'
import { TicketId } from '../../domain/value-objects/ticket-id.js'
import type { UseCase } from '../common/base-usecase.js'
import { UpdateTicketTitleRequest } from '../dtos/requests/update-ticket-title.js'
import { TicketResponse } from '../dtos/responses/ticket.js'
import { UpdateTicketTitleResponse } from '../dtos/responses/update-ticket-title.js'
import type { TicketRepository } from '../repositories/ticket-repository.js'

/**
 * Use case for updating a ticket's title.
 */
export class UpdateTicketTitleUseCase
  implements UseCase<UpdateTicketTitleRequest, UpdateTicketTitleResponse>
{
  constructor(private readonly ticketRepository: TicketRepository) {}

  async execute(request: UpdateTicketTitleRequest): Promise<UpdateTicketTitleResponse> {
    const ticketId = TicketId.create(request.id)
    const ticket = await this.ticketRepository.findById(ticketId)

    if (!ticket) {
      throw new TicketNotFoundError(ERROR_MESSAGES.TICKET_NOT_FOUND(request.id))
    }

    // Use domain method for business logic
    ticket.updateTitle(request.newTitle)

    await this.ticketRepository.save(ticket)
    return TicketResponse.fromTicket(ticket) as UpdateTicketTitleResponse
  }
}
