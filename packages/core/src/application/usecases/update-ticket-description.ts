import { ERROR_MESSAGES, TicketNotFoundError } from '@project-manager/shared'
import { TicketId } from '../../domain/value-objects/ticket-id.ts'
import type { UseCase } from '../common/base-usecase.ts'
import { TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

// Temporary compatibility classes until namespace conversion
class UpdateTicketDescriptionRequest {
  constructor(
    public readonly id: string,
    public readonly newDescription: string
  ) {}
}

class UpdateTicketDescriptionResponse extends TicketResponse {}

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
