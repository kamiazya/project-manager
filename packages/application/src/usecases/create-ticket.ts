import type { AliasGenerator } from '@project-manager/domain'
import { Ticket, TicketAlias, TicketId } from '@project-manager/domain'
import { BaseUseCase } from '../common/base-usecase.ts'
import { UseCaseExecutionError } from '../common/errors/application-errors.ts'
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
      private readonly idGenerator: IdGenerator,
      private readonly aliasGenerator: AliasGenerator
    ) {
      super()
    }

    async execute(request: Request): Promise<Response> {
      this.logger.info('Starting ticket creation', {
        title: request.title,
        priority: request.priority || 'medium',
        type: request.type ?? 'task',
      })

      // Generate ID using infrastructure service
      const idValue = this.idGenerator.generateId()
      const ticketId = TicketId.create(idValue)

      this.logger.debug('ID generation completed', {
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

      this.logger.debug('Ticket entity creation completed', {
        ticketId: ticket.id.value,
        status: ticket.status,
      })

      // Generate and set canonical alias
      const aliasValue = await this.generateUniqueAlias(ticketId)
      const ticketAlias = TicketAlias.createCanonical(aliasValue)
      ticket.setCanonicalAlias(ticketAlias)

      this.logger.debug('Canonical alias generated', {
        ticketId: ticket.id.value,
        alias: aliasValue,
      })

      // Persist through repository
      await this.ticketRepository.save(ticket)

      this.logger.info('Ticket persistence completed', {
        ticketId: ticket.id.value,
      })

      // Return response DTO
      const response = createTicketResponse(ticket)

      this.logger.info('Ticket creation successful', {
        ticketId: response.id,
        title: response.title,
      })

      return response
    }

    /**
     * Generate a unique alias that doesn't conflict with existing aliases
     */
    private async generateUniqueAlias(ticketId: TicketId): Promise<string> {
      let attempts = 0
      const maxAttempts = 10

      while (attempts < maxAttempts) {
        const candidateAlias = this.aliasGenerator.generate(ticketId)

        // Check if this alias is already in use
        const existingTicket = await this.ticketRepository.findByAlias(candidateAlias)

        if (!existingTicket) {
          return candidateAlias
        }

        // If alias is in use by the same ticket, that's okay (shouldn't happen during creation)
        if (existingTicket.id.equals(ticketId)) {
          return candidateAlias
        }

        // Collision detected - try again
        attempts++
      }

      throw new UseCaseExecutionError(
        'CreateTicketUseCase',
        'aliasGeneration',
        `Unable to generate unique alias for ticket ${ticketId.value} after ${maxAttempts} attempts. ` +
          `This may indicate high collision rate with current alias generation strategy.`
      )
    }
  }
}
