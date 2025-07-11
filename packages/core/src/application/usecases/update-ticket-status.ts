import { TicketNotFoundError } from '@project-manager/shared'
import { inject, injectable } from 'inversify'
import { TicketId } from '../../domain/value-objects/ticket-id.js'
import type { UseCase } from '../common/base-usecase.js'
import { UpdateTicketStatusRequest } from '../dtos/requests/update-ticket-status.js'
import { TicketResponse } from '../dtos/responses/ticket.js'
import { UpdateTicketStatusResponse } from '../dtos/responses/update-ticket-status.js'
import {
  type TicketRepository,
  TicketRepository as TicketRepositorySymbol,
} from '../repositories/ticket-repository.js'

/**
 * Use case for updating a ticket's status.
 */
@injectable()
export class UpdateTicketStatusUseCase
  implements UseCase<UpdateTicketStatusRequest, UpdateTicketStatusResponse>
{
  constructor(
    @inject(TicketRepositorySymbol)
    private readonly ticketRepository: TicketRepository
  ) {}

  async execute(request: UpdateTicketStatusRequest): Promise<UpdateTicketStatusResponse> {
    const ticketId = TicketId.create(request.id)
    const ticket = await this.ticketRepository.findById(ticketId)

    if (!ticket) {
      throw new TicketNotFoundError(request.id)
    }

    // Use domain method for business logic (includes validation)
    ticket.changeStatus(request.newStatus)

    await this.ticketRepository.save(ticket)
    return TicketResponse.fromTicket(ticket) as UpdateTicketStatusResponse
  }
}
