import { TicketNotFoundError } from '@project-manager/shared'
import { inject, injectable } from 'inversify'
import { TicketId } from '../../domain/value-objects/ticket-id.js'
import type { UseCase } from '../common/base-usecase.js'
import { UpdateTicketPriorityRequest } from '../dtos/requests/update-ticket-priority.js'
import { TicketResponse } from '../dtos/responses/ticket.js'
import { UpdateTicketPriorityResponse } from '../dtos/responses/update-ticket-priority.js'
import {
  type TicketRepository,
  TicketRepository as TicketRepositorySymbol,
} from '../repositories/ticket-repository.js'

/**
 * Use case for updating a ticket's priority.
 */
@injectable()
export class UpdateTicketPriorityUseCase
  implements UseCase<UpdateTicketPriorityRequest, UpdateTicketPriorityResponse>
{
  constructor(
    @inject(TicketRepositorySymbol)
    private readonly ticketRepository: TicketRepository
  ) {}

  async execute(request: UpdateTicketPriorityRequest): Promise<UpdateTicketPriorityResponse> {
    const ticketId = TicketId.create(request.id)
    const ticket = await this.ticketRepository.findById(ticketId)

    if (!ticket) {
      throw new TicketNotFoundError(request.id)
    }

    // Use domain method for business logic
    ticket.changePriority(request.newPriority)

    await this.ticketRepository.save(ticket)
    return TicketResponse.fromTicket(ticket) as UpdateTicketPriorityResponse
  }
}
