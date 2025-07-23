import { createTicketStatus, TicketId } from '@project-manager/domain'
import { BaseUseCase } from '../common/base-usecase.ts'
import { TicketNotFoundError } from '../common/errors/application-errors.js'
import { createTicketResponse, type TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import type { AuditMetadata } from '../services/audit-metadata-generator.ts'

export namespace UpdateTicketStatus {
  /**
   * Request DTO for updating ticket status
   */
  export interface Request {
    readonly id: string
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
    public readonly auditMetadata: AuditMetadata = {
      operationId: 'ticket.updateStatus',
      operationType: 'update',
      resourceType: 'Ticket',
      description: 'Updates the status of a ticket',
      useCaseName: 'UpdateTicketStatus',

      extractBeforeState: async (request: Request) => {
        const ticketId = TicketId.create(request.id)
        const ticket = await this.ticketRepository.findById(ticketId)
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

    constructor(private readonly ticketRepository: TicketRepository) {
      super()
    }

    async execute(request: Request): Promise<Response> {
      await this.logger.info('Starting ticket status update', {
        ticketId: request.id,
        newStatus: request.newStatus,
      })

      const ticketId = TicketId.create(request.id)
      const ticket = await this.ticketRepository.findById(ticketId)

      if (!ticket) {
        await this.logger.warn('Ticket not found for status update', {
          ticketId: request.id,
        })
        throw new TicketNotFoundError(request.id, 'UpdateTicketStatus')
      }

      const oldStatus = ticket.status

      await this.logger.debug('Changing ticket status', {
        ticketId: ticketId.value,
        from: oldStatus,
        to: request.newStatus,
      })

      // Validate and create status
      const validatedStatus = createTicketStatus(request.newStatus)
      ticket.changeStatus(validatedStatus)

      await this.ticketRepository.save(ticket)

      const response = createTicketResponse(ticket)

      await this.logger.info('Ticket status updated successfully', {
        ticketId: response.id,
        oldStatus,
        newStatus: response.status,
      })

      return response
    }
  }
}
