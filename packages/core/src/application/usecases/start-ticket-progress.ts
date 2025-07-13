import { ERROR_MESSAGES, TicketNotFoundError } from '@project-manager/shared'
import { TicketId } from '../../domain/value-objects/ticket-id.ts'
import type { UseCase } from '../common/base-usecase.ts'
import { StartTicketProgressRequest } from '../dtos/requests/start-ticket-progress.ts'
import { StartTicketProgressResponse } from '../dtos/responses/start-ticket-progress.ts'
import { TicketResponse } from '../dtos/responses/ticket.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

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
