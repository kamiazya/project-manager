import { TicketId } from '@project-manager/domain'
import type { UseCase as IUseCase } from '../common/base-usecase.ts'
import { TicketNotFoundError, TicketValidationError } from '../common/errors/application-errors.js'
import { createTicketResponse, type TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

export namespace UpdateTicketContent {
  /**
   * Request DTO for updating ticket content (title and description)
   */
  export interface Request {
    readonly id: string
    readonly updates: {
      title?: string
      description?: string
    }
  }

  /**
   * Response DTO for update result
   */
  export type Response = TicketResponse

  /**
   * Unified use case for updating ticket content fields (title and description).
   * This provides a focused approach for content updates, with other aspects like
   * status, priority, and type handled by dedicated use cases.
   */
  export class UseCase implements IUseCase<Request, Response> {
    constructor(private readonly ticketRepository: TicketRepository) {}

    async execute(request: Request): Promise<Response> {
      // Validate that at least one field is provided for update
      const hasUpdates =
        request.updates.title !== undefined || request.updates.description !== undefined
      if (!hasUpdates) {
        throw new TicketValidationError(
          'At least one field must be provided for update',
          'update',
          'UpdateTicketContent'
        )
      }

      // Single fetch operation
      const ticketId = TicketId.create(request.id)
      const ticket = await this.ticketRepository.findById(ticketId)

      if (!ticket) {
        throw new TicketNotFoundError(request.id, 'UpdateTicketContent')
      }

      // Apply content updates using domain methods (includes validation)
      if (request.updates.title !== undefined) {
        ticket.updateTitle(request.updates.title)
      }

      if (request.updates.description !== undefined) {
        ticket.updateDescription(request.updates.description)
      }

      // Single save operation
      await this.ticketRepository.save(ticket)

      return createTicketResponse(ticket)
    }
  }
}
