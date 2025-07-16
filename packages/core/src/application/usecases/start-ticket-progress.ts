import { ERROR_MESSAGES, TicketNotFoundError } from '@project-manager/shared'
import { TicketId } from '../../domain/value-objects/ticket-id.ts'
import type { UseCase } from '../common/base-usecase.ts'
import { TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

// Temporary compatibility classes until namespace conversion
class StartTicketProgressRequest {
  constructor(public readonly id: string) {}
}

class StartTicketProgressResponse extends TicketResponse {}

/**
 * Use case for starting progress on a ticket.
 */
export class StartTicketProgressUseCase
  implements UseCase<StartTicketProgressRequest, StartTicketProgressResponse>
{
  constructor(private readonly ticketRepository: TicketRepository) {}

  async execute(request: StartTicketProgressRequest): Promise<StartTicketProgressResponse> {
    const ticketId = TicketId.create(request.id)
    const ticket = await this.ticketRepository.findById(ticketId)

    if (!ticket) {
      throw new TicketNotFoundError(ERROR_MESSAGES.TICKET_NOT_FOUND(request.id))
    }

    // Use domain business operation
    ticket.startProgress()

    await this.ticketRepository.save(ticket)
    return TicketResponse.fromTicket(ticket) as StartTicketProgressResponse
  }
}
