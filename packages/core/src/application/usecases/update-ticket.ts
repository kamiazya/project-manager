import { TicketNotFoundError, TicketValidationError } from '@project-manager/shared'
import { TicketId } from '../../domain/value-objects/ticket-id.ts'
import type { UseCase } from '../common/base-usecase.ts'
import { TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

// Temporary compatibility classes until namespace conversion
class UpdateTicketRequest {
  constructor(
    public readonly id: string,
    public readonly title?: string,
    public readonly description?: string,
    public readonly status?: 'pending' | 'in_progress' | 'completed' | 'archived',
    public readonly priority?: 'high' | 'medium' | 'low'
  ) {}

  hasUpdates(): boolean {
    return (
      this.title !== undefined ||
      this.description !== undefined ||
      this.status !== undefined ||
      this.priority !== undefined
    )
  }
}

class UpdateTicketResponse extends TicketResponse {
  // For backward compatibility with existing code
  get ticket(): TicketResponse {
    return this
  }
}

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
