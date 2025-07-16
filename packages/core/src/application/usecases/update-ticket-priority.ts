import { ERROR_MESSAGES, TicketNotFoundError } from '@project-manager/shared'
import { TicketId } from '../../domain/value-objects/ticket-id.ts'
import type { UseCase } from '../common/base-usecase.ts'
import { TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

// Temporary compatibility classes until namespace conversion
class UpdateTicketPriorityRequest {
  constructor(
    public readonly id: string,
    public readonly newPriority: 'high' | 'medium' | 'low'
  ) {}
}

class UpdateTicketPriorityResponse extends TicketResponse {}

/**
 * Use case for updating a ticket's priority.
 */
export class UpdateTicketPriorityUseCase
  implements UseCase<UpdateTicketPriorityRequest, UpdateTicketPriorityResponse>
{
  constructor(private readonly ticketRepository: TicketRepository) {}

  async execute(request: UpdateTicketPriorityRequest): Promise<UpdateTicketPriorityResponse> {
    const ticketId = TicketId.create(request.id)
    const ticket = await this.ticketRepository.findById(ticketId)

    if (!ticket) {
      throw new TicketNotFoundError(ERROR_MESSAGES.TICKET_NOT_FOUND(request.id))
    }

    // Use domain method for business logic
    ticket.changePriority(request.newPriority)

    await this.ticketRepository.save(ticket)
    return TicketResponse.fromTicket(ticket) as UpdateTicketPriorityResponse
  }
}
