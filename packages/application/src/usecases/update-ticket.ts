import { TicketId } from '@project-manager/domain'
import { TicketNotFoundError, TicketValidationError } from '@project-manager/shared'
import type { UseCase as IUseCase } from '../common/base-usecase.ts'
import { TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

export namespace UpdateTicket {
  /**
   * Request DTO for updating a ticket
   */
  export class Request {
    constructor(
      public readonly id: string,
      public readonly updates: {
        title?: string
        description?: string
        status?: 'pending' | 'in_progress' | 'completed' | 'archived'
        priority?: 'high' | 'medium' | 'low'
        type?: 'feature' | 'bug' | 'task'
      }
    ) {}

    hasUpdates(): boolean {
      return (
        this.updates.title !== undefined ||
        this.updates.description !== undefined ||
        this.updates.status !== undefined ||
        this.updates.priority !== undefined ||
        this.updates.type !== undefined
      )
    }
  }

  /**
   * Response DTO for update result
   */
  export class Response extends TicketResponse {
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
  export class UseCase implements IUseCase<Request, Response> {
    constructor(private readonly ticketRepository: TicketRepository) {}

    async execute(request: Request): Promise<Response> {
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
      if (request.updates.title !== undefined) {
        ticket.updateTitle(request.updates.title)
      }

      if (request.updates.description !== undefined) {
        ticket.updateDescription(request.updates.description)
      }

      if (request.updates.status !== undefined) {
        ticket.changeStatus(request.updates.status)
      }

      if (request.updates.priority !== undefined) {
        ticket.changePriority(request.updates.priority)
      }

      if (request.updates.type !== undefined) {
        ticket.changeType(request.updates.type)
      }

      // Single save operation
      await this.ticketRepository.save(ticket)

      return TicketResponse.fromTicket(ticket) as Response
    }
  }
}
