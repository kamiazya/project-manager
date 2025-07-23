import { TicketId } from '@project-manager/domain'
import type { ApplicationLogger, AuditableUseCase, AuditMetadata } from '../logging/index.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

export namespace DeleteTicket {
  export interface Request {
    readonly id: string
  }

  /**
   * Use case for deleting a ticket.
   */
  export class UseCase implements AuditableUseCase<Request, void> {
    public logger!: ApplicationLogger // Injected by framework

    public readonly auditMetadata: AuditMetadata = {
      operationId: 'ticket.delete',
      operationType: 'delete',
      resourceType: 'Ticket',
      description: 'Deletes an existing ticket',
      useCaseName: 'DeleteTicket',

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

    constructor(private readonly ticketRepository: TicketRepository) {}

    async execute(request: Request): Promise<void> {
      await this.logger.info('Starting ticket deletion', {
        ticketId: request.id,
      })

      const ticketId = TicketId.create(request.id)

      await this.logger.debug('Validating ticket for deletion', {
        ticketId: ticketId.value,
      })

      await this.ticketRepository.delete(ticketId)

      await this.logger.info('Ticket deletion completed', {
        ticketId: ticketId.value,
      })
    }
  }
}
