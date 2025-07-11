import { inject, injectable } from 'inversify'
import { TicketId } from '../../domain/value-objects/ticket-id.js'
import type { UseCase } from '../common/base-usecase.js'
import { CompleteTicketRequest } from '../dtos/requests/complete-ticket.js'
import { CompleteTicketResponse } from '../dtos/responses/complete-ticket.js'
import { TicketResponse } from '../dtos/responses/ticket.js'
import {
  type TicketRepository,
  TicketRepository as TicketRepositorySymbol,
} from '../repositories/ticket-repository.js'

/**
 * Use case for completing a ticket.
 */
@injectable()
export class CompleteTicketUseCase
  implements UseCase<CompleteTicketRequest, CompleteTicketResponse>
{
  constructor(
    @inject(TicketRepositorySymbol)
    private readonly ticketRepository: TicketRepository
  ) {}

  async execute(request: CompleteTicketRequest): Promise<CompleteTicketResponse> {
    const ticketId = TicketId.create(request.id)
    const ticket = await this.ticketRepository.findById(ticketId)

    if (!ticket) {
      throw new Error(`Ticket not found: ${request.id}`)
    }

    // Use domain business operation
    ticket.complete()

    await this.ticketRepository.save(ticket)
    return TicketResponse.fromTicket(ticket) as CompleteTicketResponse
  }
}
