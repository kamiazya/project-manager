import { inject, injectable } from 'inversify'
import { TicketId } from '../../domain/value-objects/ticket-id.js'
import type { UseCase } from '../common/base-usecase.js'
import { UpdateTicketTitleRequest } from '../dtos/requests/update-ticket-title.js'
import { TicketResponse } from '../dtos/responses/ticket.js'
import { UpdateTicketTitleResponse } from '../dtos/responses/update-ticket-title.js'
import {
  type TicketRepository,
  TicketRepository as TicketRepositorySymbol,
} from '../repositories/ticket-repository.js'

/**
 * Use case for updating a ticket's title.
 */
@injectable()
export class UpdateTicketTitleUseCase
  implements UseCase<UpdateTicketTitleRequest, UpdateTicketTitleResponse>
{
  constructor(
    @inject(TicketRepositorySymbol)
    private readonly ticketRepository: TicketRepository
  ) {}

  async execute(request: UpdateTicketTitleRequest): Promise<UpdateTicketTitleResponse> {
    const ticketId = TicketId.create(request.id)
    const ticket = await this.ticketRepository.findById(ticketId)

    if (!ticket) {
      throw new Error(`Ticket not found: ${request.id}`)
    }

    // Use domain method for business logic
    ticket.updateTitle(request.newTitle)

    await this.ticketRepository.save(ticket)
    return TicketResponse.fromTicket(ticket) as UpdateTicketTitleResponse
  }
}
