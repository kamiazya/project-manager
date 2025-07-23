import { Ticket, TicketId } from '@project-manager/domain'
import { BaseUseCase } from '../common/base-usecase.ts'
import { createTicketResponse, type TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import type { AuditMetadata } from '../services/audit-metadata-generator.ts'
import type { IdGenerator } from '../services/id-generator.interface.ts'

export namespace CreateTicket {
  /**
   * Request DTO for creating a new ticket
   */
  export interface Request {
    readonly title: string
    readonly priority?: string
    readonly type?: string
    readonly status?: string
    readonly description?: string
  }

  /**
   * Response DTO for ticket creation
   */
  export type Response = TicketResponse

  /**
   * Use case for creating a new ticket.
   * Follows the Single Responsibility Principle with focused responsibility.
   */
  export class UseCase extends BaseUseCase<Request, Response> {
    public readonly auditMetadata: AuditMetadata = {
      operationId: 'ticket.create',
      operationType: 'create',
      resourceType: 'Ticket',
      description: 'Creates a new ticket with specified properties',

      extractBeforeState: async (_request: Request) => {
        // For creation operations, there's no before state
        return null
      },

      extractAfterState: async (_request: Request, response: Response) => {
        return {
          ticketId: response.id,
          title: response.title,
          status: response.status,
          priority: response.priority,
          type: response.type,
        }
      },
    }

    constructor(
      private readonly ticketRepository: TicketRepository,
      private readonly idGenerator: IdGenerator
    ) {
      super()
    }

    async execute(request: Request): Promise<Response> {
      await this.logger.info('Starting ticket creation', {
        title: request.title,
        priority: request.priority || 'medium',
        type: request.type ?? 'task',
      })

      // Generate ID using infrastructure service
      const idValue = this.idGenerator.generateId()
      const ticketId = TicketId.create(idValue)

      await this.logger.debug('ID generation completed', {
        generatedId: idValue,
      })

      // Use domain entity factory method with pre-generated ID
      const ticket = Ticket.create(ticketId, {
        title: request.title.trim(),
        description: request.description?.trim(),
        priority: request.priority || 'medium',
        type: request.type ?? 'task',
        status: request.status || 'pending',
      })

      await this.logger.debug('Ticket entity creation completed', {
        ticketId: ticket.id.value,
        status: ticket.status,
      })

      // Persist through repository
      await this.ticketRepository.save(ticket)

      await this.logger.info('Ticket persistence completed', {
        ticketId: ticket.id.value,
      })

      // Return response DTO
      const response = createTicketResponse(ticket)

      await this.logger.info('Ticket creation successful', {
        ticketId: response.id,
        title: response.title,
      })

      return response
    }
  }
}
