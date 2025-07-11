import { inject, injectable } from 'inversify'
import { TicketId } from '../../domain/value-objects/ticket-id.js'
import type { UseCase } from '../common/base-usecase.js'
import { UpdateTicketDescriptionRequest } from '../dtos/requests/update-ticket-description.js'
import { TicketResponse } from '../dtos/responses/ticket.js'
import { UpdateTicketDescriptionResponse } from '../dtos/responses/update-ticket-description.js'
import {
  type TicketRepository,
  TicketRepository as TicketRepositorySymbol,
} from '../repositories/ticket-repository.js'

/**
 * Use case for updating a ticket's description.
 */
@injectable()
export class UpdateTicketDescriptionUseCase
  implements UseCase<UpdateTicketDescriptionRequest, UpdateTicketDescriptionResponse>
{
  constructor(
    @inject(TicketRepositorySymbol)
    private readonly ticketRepository: TicketRepository
  ) {}

  async execute(request: UpdateTicketDescriptionRequest): Promise<UpdateTicketDescriptionResponse> {
    const ticketId = TicketId.create(request.id)
    const ticket = await this.ticketRepository.findById(ticketId)

    if (!ticket) {
      throw new Error(`Ticket not found: ${request.id}`)
    }

    // Use domain method for business logic
    ticket.updateDescription(request.newDescription)

    await this.ticketRepository.save(ticket)
    return TicketResponse.fromTicket(ticket) as UpdateTicketDescriptionResponse
  }
}
