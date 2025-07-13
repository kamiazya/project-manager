import { ERROR_MESSAGES, TicketNotFoundError } from '@project-manager/shared'
import { TicketId } from '../../domain/value-objects/ticket-id.js'
import type { UseCase } from '../common/base-usecase.js'
import { StartTicketProgressRequest } from '../dtos/requests/start-ticket-progress.js'
import { StartTicketProgressResponse } from '../dtos/responses/start-ticket-progress.js'
import { TicketResponse } from '../dtos/responses/ticket.js'
import type { TicketRepository } from '../repositories/ticket-repository.js'

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
