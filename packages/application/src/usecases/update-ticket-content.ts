import { BaseUseCase } from '../common/base-usecase.ts'
import { TicketNotFoundError, TicketValidationError } from '../common/errors/application-errors.js'
import { createTicketResponse, type TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import type { AuditMetadata } from '../services/audit-metadata-generator.ts'
import { TicketResolutionService } from '../services/ticket-resolution.service.ts'

export namespace UpdateTicketContent {
  /**
   * Request DTO for updating ticket content (title and description)
   */
  export interface Request {
    readonly identifier: string
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
   *
   * Supports both ticket ID and alias resolution.
   */
  export class UseCase extends BaseUseCase<Request, Response> {
    private readonly resolutionService: TicketResolutionService

    constructor(private readonly ticketRepository: TicketRepository) {
      super()
      this.resolutionService = new TicketResolutionService(ticketRepository)
    }

    public readonly auditMetadata: AuditMetadata = {
      operationId: 'ticket.updateContent',
      operationType: 'update',
      resourceType: 'Ticket',
      description: 'Updates ticket title and/or description',

      extractBeforeState: async (request: Request) => {
        const { ticket } = await this.resolutionService.resolveTicket(request.identifier)
        if (!ticket) {
          return null
        }
        return {
          ticketId: ticket.id.value,
          title: ticket.title.value,
          description: ticket.description?.value,
        }
      },

      extractAfterState: async (request: Request, response: Response) => {
        return {
          ticketId: response.id,
          title: response.title,
          description: response.description,
          updatedFields: Object.keys(request.updates),
        }
      },
    }

    async execute(request: Request): Promise<Response> {
      this.logger.info('Starting ticket content update', {
        ticketIdentifier: request.identifier,
        fieldsToUpdate: Object.keys(request.updates),
      })

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

      // Resolve ticket by ID or alias
      const { ticket, resolvedBy } = await this.resolutionService.resolveTicket(request.identifier)

      if (!ticket) {
        this.logger.warn('Ticket not found for content update', {
          ticketIdentifier: request.identifier,
        })
        throw new TicketNotFoundError(request.identifier, 'UpdateTicketContent')
      }

      this.logger.debug('Applying content updates', {
        ticketId: ticket.id.value,
        ticketIdentifier: request.identifier,
        resolvedBy,
        hasTitle: request.updates.title !== undefined,
        hasDescription: request.updates.description !== undefined,
      })

      // Apply content updates using domain methods (includes validation)
      if (request.updates.title !== undefined) {
        ticket.updateTitle(request.updates.title)
      }

      if (request.updates.description !== undefined) {
        ticket.updateDescription(request.updates.description)
      }

      // Single save operation
      await this.ticketRepository.save(ticket)

      const response = createTicketResponse(ticket)

      this.logger.info('Ticket content updated successfully', {
        ticketId: response.id,
        updatedFields: Object.keys(request.updates),
      })

      return response
    }
  }
}
