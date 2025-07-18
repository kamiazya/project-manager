import { ERROR_MESSAGES, TicketNotFoundError } from '@project-manager/shared'
import { TicketId } from '../../domain/value-objects/ticket-id.ts'
import type { UseCase } from '../common/base-usecase.ts'
import { UpdateTicketStatusRequest } from '../dtos/requests/update-ticket-status.ts'
import { TicketResponse } from '../dtos/responses/ticket.ts'
import { UpdateTicketStatusResponse } from '../dtos/responses/update-ticket-status.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

/**
 * Use case for updating a ticket's status.
 */
export class UpdateTicketStatusUseCase
  implements UseCase<UpdateTicketStatusRequest, UpdateTicketStatusResponse>
{
  constructor(private readonly ticketRepository: TicketRepository) {}

  async execute(request: UpdateTicketStatusRequest): Promise<UpdateTicketStatusResponse> {
    const ticketId = TicketId.create(request.id)
    const ticket = await this.ticketRepository.findById(ticketId)

    if (!ticket) {
      throw new TicketNotFoundError(ERROR_MESSAGES.TICKET_NOT_FOUND(request.id))
    }

    // Use domain method for business logic (includes validation)
    ticket.changeStatus(request.newStatus)

    await this.ticketRepository.save(ticket)
    return TicketResponse.fromTicket(ticket) as UpdateTicketStatusResponse
  }
}
