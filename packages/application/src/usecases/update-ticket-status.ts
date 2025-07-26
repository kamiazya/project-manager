import { createTicketStatus } from '@project-manager/domain'
import { BaseUseCase } from '../common/base-usecase.ts'
import { TicketNotFoundError } from '../common/errors/application-errors.js'
import { createTicketResponse, type TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import type { AuditMetadata } from '../services/audit-metadata-generator.ts'
import { TicketResolutionService } from '../services/ticket-resolution.service.ts'

export namespace UpdateTicketStatus {
  /**
   * Request DTO for updating ticket status
   */
  export interface Request {
    readonly identifier: string
    readonly newStatus: string
  }

  /**
   * Response DTO for status update result
   */
  export type Response = TicketResponse

  /**
   * Use case for updating a ticket's status.
   */
  export class UseCase extends BaseUseCase<Request, Response> {
    private readonly resolutionService: TicketResolutionService

    constructor(private readonly ticketRepository: TicketRepository) {
      super()
      this.resolutionService = new TicketResolutionService(ticketRepository)
    }

    public readonly auditMetadata: AuditMetadata = {
      operationId: 'ticket.updateStatus',
      operationType: 'update',
      resourceType: 'Ticket',
      description: 'Updates the status of a ticket',

      extractBeforeState: async (request: Request) => {
        const { ticket } = await this.resolutionService.resolveTicket(request.identifier)
        if (!ticket) {
          return null
        }
        return {
          ticketId: ticket.id.value,
          status: ticket.status,
        }
      },

      extractAfterState: async (_request: Request, response: Response) => {
        return {
          ticketId: response.id,
          status: response.status,
        }
      },
    }

    async execute(request: Request): Promise<Response> {
      this.logger.info('Starting ticket status update', {
        ticketIdentifier: request.identifier,
        newStatus: request.newStatus,
      })

      const { ticket, resolvedBy } = await this.resolutionService.resolveTicket(request.identifier)

      if (!ticket) {
        this.logger.warn('Ticket not found for status update', {
          ticketIdentifier: request.identifier,
        })
        throw new TicketNotFoundError(request.identifier, 'UpdateTicketStatus')
      }

      const oldStatus = ticket.status

      this.logger.debug('Changing ticket status', {
        ticketId: ticket.id.value,
        ticketIdentifier: request.identifier,
        resolvedBy,
        from: oldStatus,
        to: request.newStatus,
      })

      // Validate and create status
      const validatedStatus = createTicketStatus(request.newStatus)
      ticket.changeStatus(validatedStatus)

      await this.ticketRepository.save(ticket)

      const response = createTicketResponse(ticket)

      this.logger.info('Ticket status updated successfully', {
        ticketId: response.id,
        oldStatus,
        newStatus: response.status,
      })

      return response
    }
  }
}
