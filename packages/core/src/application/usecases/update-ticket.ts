import { TicketNotFoundError, TicketValidationError } from '@project-manager/shared'
import { TicketId } from '../../domain/value-objects/ticket-id.ts'
import type { UseCase } from '../common/base-usecase.ts'
import { UpdateTicketRequest } from '../dtos/requests/update-ticket.ts'
import { TicketResponse } from '../dtos/responses/ticket.ts'
import { UpdateTicketResponse } from '../dtos/responses/update-ticket.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

/**
 * Unified use case for updating multiple ticket fields in a single operation.
 * This addresses the performance issue where separate update operations cause
 * multiple I/O operations by consolidating them into a single fetch-update-save cycle.
 */
export class UpdateTicketUseCase implements UseCase<UpdateTicketRequest, UpdateTicketResponse> {
  constructor(private readonly ticketRepository: TicketRepository) {}

  async execute(request: UpdateTicketRequest): Promise<UpdateTicketResponse> {
    // Validate that at least one field is provided for update
    if (!request.hasUpdates()) {
      throw new TicketValidationError('At least one field must be provided for update', 'update')
    }

    // Single fetch operation
    const ticketId = TicketId.create(request.id)
    const ticket = await this.ticketRepository.findById(ticketId)

    if (!ticket) {
      throw new TicketNotFoundError(request.id)
    }

    // Apply all updates using domain methods (includes validation)
    if (request.title !== undefined) {
      ticket.updateTitle(request.title)
    }

    if (request.description !== undefined) {
      ticket.updateDescription(request.description)
    }

    if (request.status !== undefined) {
      ticket.changeStatus(request.status)
    }

    if (request.priority !== undefined) {
      ticket.changePriority(request.priority)
    }

    // Single save operation
    await this.ticketRepository.save(ticket)

    return TicketResponse.fromTicket(ticket) as UpdateTicketResponse
  }
}
