import { ERROR_MESSAGES, TicketNotFoundError } from '@project-manager/shared'
import { TicketId } from '../../domain/value-objects/ticket-id.ts'
import type { UseCase } from '../common/base-usecase.ts'
import { TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

// Temporary compatibility classes until namespace conversion
class UpdateTicketTitleRequest {
  constructor(
    public readonly id: string,
    public readonly newTitle: string
  ) {}
}

class UpdateTicketTitleResponse extends TicketResponse {}

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
