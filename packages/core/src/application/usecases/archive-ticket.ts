import { ERROR_MESSAGES, TicketNotFoundError } from '@project-manager/shared'
import { TicketId } from '../../domain/value-objects/ticket-id.js'
import type { UseCase } from '../common/base-usecase.js'
import { ArchiveTicketRequest } from '../dtos/requests/archive-ticket.js'
import { ArchiveTicketResponse } from '../dtos/responses/archive-ticket.js'
import { TicketResponse } from '../dtos/responses/ticket.js'
import type { TicketRepository } from '../repositories/ticket-repository.js'

/**
 * Use case for archiving a ticket.
 */
export class ArchiveTicketUseCase implements UseCase<ArchiveTicketRequest, ArchiveTicketResponse> {
  constructor(private readonly ticketRepository: TicketRepository) {}

  async execute(request: ArchiveTicketRequest): Promise<ArchiveTicketResponse> {
    const ticketId = TicketId.create(request.id)
    const ticket = await this.ticketRepository.findById(ticketId)

    if (!ticket) {
      throw new TicketNotFoundError(ERROR_MESSAGES.TICKET_NOT_FOUND(request.id))
    }

    // Use domain business operation
    ticket.archive()

    await this.ticketRepository.save(ticket)
    return TicketResponse.fromTicket(ticket) as ArchiveTicketResponse
  }
}
