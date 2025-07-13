import { ERROR_MESSAGES, TicketNotFoundError } from '@project-manager/shared'
import { TicketId } from '../../domain/value-objects/ticket-id.ts'
import type { UseCase } from '../common/base-usecase.ts'
import { ArchiveTicketRequest } from '../dtos/requests/archive-ticket.ts'
import { ArchiveTicketResponse } from '../dtos/responses/archive-ticket.ts'
import { TicketResponse } from '../dtos/responses/ticket.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

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
