import { createTicketPriority, TicketId } from '@project-manager/domain'
import { BaseUseCase } from '../common/base-usecase.ts'
import { TicketNotFoundError } from '../common/errors/application-errors.js'
import { createTicketResponse, type TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import type { AuditMetadata } from '../services/audit-metadata-generator.ts'

export namespace UpdateTicketPriority {
  /**
   * Request DTO for updating ticket priority
   */
  export interface Request {
    readonly id: string
    readonly newPriority: string
  }

  /**
   * Response DTO for priority update result
   */
  export type Response = TicketResponse

  /**
   * Use case for updating a ticket's priority.
   */
  export class UseCase extends BaseUseCase<Request, Response> {
    public readonly auditMetadata: AuditMetadata = {
      operationId: 'ticket.updatePriority',
      operationType: 'update',
      resourceType: 'Ticket',
      description: 'Updates the priority of a ticket',

      extractBeforeState: async (request: Request) => {
        const ticketId = TicketId.create(request.id)
        const ticket = await this.ticketRepository.findById(ticketId)
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

    constructor(private readonly ticketRepository: TicketRepository) {
      super()
    }

    async execute(request: Request): Promise<Response> {
      await this.logger.info('Starting ticket priority update', {
        ticketId: request.id,
        newPriority: request.newPriority,
      })

      const ticketId = TicketId.create(request.id)
      const ticket = await this.ticketRepository.findById(ticketId)

      if (!ticket) {
        await this.logger.warn('Ticket not found for priority update', {
          ticketId: request.id,
        })
        throw new TicketNotFoundError(request.id, 'UpdateTicketPriority')
      }

      const oldPriority = ticket.priority

      await this.logger.debug('Changing ticket priority', {
        ticketId: ticketId.value,
        from: oldPriority,
        to: request.newPriority,
      })

      // Validate priority in execute method
      const validatedPriority = createTicketPriority(request.newPriority)
      ticket.changePriority(validatedPriority)

      await this.ticketRepository.save(ticket)

      const response = createTicketResponse(ticket)

      await this.logger.info('Ticket priority updated successfully', {
        ticketId: response.id,
        oldPriority,
        newPriority: response.priority,
      })

      return response
    }
  }
}
