import { BaseUseCase } from '../common/base-usecase.ts'
import { TicketNotFoundError } from '../common/errors/application-errors.js'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import type { AuditMetadata } from '../services/audit-metadata-generator.ts'
import { TicketResolutionService } from '../services/ticket-resolution.service.ts'

export namespace DeleteTicket {
  export interface Request {
    readonly identifier: string
  }

  /**
   * Use case for deleting a ticket.
   * Supports both ticket ID and alias resolution.
   */
  export class UseCase extends BaseUseCase<Request, void> {
    private readonly resolutionService: TicketResolutionService

    constructor(private readonly ticketRepository: TicketRepository) {
      super()
      this.resolutionService = new TicketResolutionService(ticketRepository)
    }

    public readonly auditMetadata: AuditMetadata = {
      operationId: 'ticket.delete',
      operationType: 'delete',
      resourceType: 'Ticket',
      description: 'Deletes an existing ticket',

      extractBeforeState: async (request: Request) => {
        // Get the ticket state before deletion
        const { ticket } = await this.resolutionService.resolveTicket(request.identifier)
        if (!ticket) {
          return null
        }
        return {
          ticketId: ticket.id.value,
          title: ticket.title.value,
          status: ticket.status,
          priority: ticket.priority,
          type: ticket.type,
        }
      },

      extractAfterState: async (_request: Request, _response: undefined) => {
        // After deletion, there's no state
        return null
      },
    }

    async execute(request: Request): Promise<void> {
      this.logger.info('Starting ticket deletion', {
        ticketIdentifier: request.identifier,
      })

      // Resolve ticket by ID or alias
      const { ticket, resolvedBy } = await this.resolutionService.resolveTicket(request.identifier)

      if (!ticket) {
        this.logger.warn('Ticket not found for deletion', {
          ticketIdentifier: request.identifier,
        })
        throw new TicketNotFoundError(request.identifier, 'DeleteTicket')
      }

      this.logger.debug('Validating ticket for deletion', {
        ticketId: ticket.id.value,
        ticketIdentifier: request.identifier,
        resolvedBy,
      })

      await this.ticketRepository.delete(ticket.id)

      this.logger.info('Ticket deletion completed', {
        ticketId: ticket.id.value,
        ticketIdentifier: request.identifier,
        resolvedBy,
      })
    }
  }
}
