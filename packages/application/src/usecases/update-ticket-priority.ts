import { createTicketPriority } from '@project-manager/domain'
import { BaseUseCase } from '../common/base-usecase.ts'
import { TicketNotFoundError } from '../common/errors/application-errors.js'
import { createTicketResponse, type TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import type { AuditMetadata } from '../services/audit-metadata-generator.ts'
import { TicketResolutionService } from '../services/ticket-resolution.service.ts'

export namespace UpdateTicketPriority {
  /**
   * Request DTO for updating ticket priority
   */
  export interface Request {
    readonly identifier: string
    readonly newPriority: string
  }

  /**
   * Response DTO for priority update result
   */
  export type Response = TicketResponse

  /**
   * Use case for updating a ticket's priority.
   * Supports both ticket ID and alias resolution.
   */
  export class UseCase extends BaseUseCase<Request, Response> {
    private readonly resolutionService: TicketResolutionService

    constructor(private readonly ticketRepository: TicketRepository) {
      super()
      this.resolutionService = new TicketResolutionService(ticketRepository)
    }

    public readonly auditMetadata: AuditMetadata = {
      operationId: 'ticket.updatePriority',
      operationType: 'update',
      resourceType: 'Ticket',
      description: 'Updates the priority of a ticket',

      extractBeforeState: async (request: Request) => {
        const { ticket } = await this.resolutionService.resolveTicket(request.identifier)
        if (!ticket) {
          return null
        }
        return {
          ticketId: ticket.id.value,
          priority: ticket.priority,
        }
      },

      extractAfterState: async (_request: Request, response: Response) => {
        return {
          ticketId: response.id,
          priority: response.priority,
        }
      },
    }

    async execute(request: Request): Promise<Response> {
      this.logger.info('Starting ticket priority update', {
        ticketIdentifier: request.identifier,
        newPriority: request.newPriority,
      })

      // Resolve ticket by ID or alias
      const { ticket, resolvedBy } = await this.resolutionService.resolveTicket(request.identifier)

      if (!ticket) {
        this.logger.warn('Ticket not found for priority update', {
          ticketIdentifier: request.identifier,
        })
        throw new TicketNotFoundError(request.identifier, 'UpdateTicketPriority')
      }

      const oldPriority = ticket.priority

      this.logger.debug('Changing ticket priority', {
        ticketId: ticket.id.value,
        ticketIdentifier: request.identifier,
        resolvedBy,
        from: oldPriority,
        to: request.newPriority,
      })

      // Validate priority in execute method
      const validatedPriority = createTicketPriority(request.newPriority)
      ticket.changePriority(validatedPriority)

      await this.ticketRepository.save(ticket)

      const response = createTicketResponse(ticket)

      this.logger.info('Ticket priority updated successfully', {
        ticketId: response.id,
        oldPriority,
        newPriority: response.priority,
      })

      return response
    }
  }
}
