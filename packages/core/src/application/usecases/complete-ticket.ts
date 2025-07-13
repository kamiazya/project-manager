import { ERROR_MESSAGES, TicketNotFoundError } from '@project-manager/shared'
import { TicketId } from '../../domain/value-objects/ticket-id.ts'
import type { UseCase } from '../common/base-usecase.ts'
import { CompleteTicketRequest } from '../dtos/requests/complete-ticket.ts'
import { CompleteTicketResponse } from '../dtos/responses/complete-ticket.ts'
import { TicketResponse } from '../dtos/responses/ticket.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

/**
 * Use case for completing a ticket.
 */
export class CompleteTicketUseCase
  implements UseCase<CompleteTicketRequest, CompleteTicketResponse>
{
  constructor(private readonly ticketRepository: TicketRepository) {}

  async execute(request: CompleteTicketRequest): Promise<CompleteTicketResponse> {
    const ticketId = TicketId.create(request.id)
    const ticket = await this.ticketRepository.findById(ticketId)

    if (!ticket) {
      throw new TicketNotFoundError(ERROR_MESSAGES.TICKET_NOT_FOUND(request.id))
    }

    // Use domain business operation
    ticket.complete()

    await this.ticketRepository.save(ticket)
    return TicketResponse.fromTicket(ticket) as CompleteTicketResponse
  }
}
