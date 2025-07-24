import { TicketId } from '@project-manager/domain'
import { BaseUseCase } from '../common/base-usecase.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import type { AuditMetadata } from '../services/audit-metadata-generator.ts'

export namespace DeleteTicket {
  export interface Request {
    readonly id: string
  }

  /**
   * Use case for deleting a ticket.
   */
  export class UseCase extends BaseUseCase<Request, void> {
    public readonly auditMetadata: AuditMetadata = {
      operationId: 'ticket.delete',
      operationType: 'delete',
      resourceType: 'Ticket',
      description: 'Deletes an existing ticket',

      extractBeforeState: async (request: Request) => {
        // Get the ticket state before deletion
        const ticketId = TicketId.create(request.id)
        const ticket = await this.ticketRepository.findById(ticketId)
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

    constructor(private readonly ticketRepository: TicketRepository) {
      super()
    }

    async execute(request: Request): Promise<void> {
      this.logger.info('Starting ticket deletion', {
        ticketId: request.id,
      })

      const ticketId = TicketId.create(request.id)

      this.logger.debug('Validating ticket for deletion', {
        ticketId: ticketId.value,
      })

      await this.ticketRepository.delete(ticketId)

      this.logger.info('Ticket deletion completed', {
        ticketId: ticketId.value,
      })
    }
  }
}
