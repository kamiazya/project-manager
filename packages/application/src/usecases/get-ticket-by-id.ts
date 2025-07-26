import { BaseUseCase } from '../common/base-usecase.ts'
import { createTicketResponse, type TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
import type { AuditMetadata } from '../services/audit-metadata-generator.ts'
import { TicketResolutionService } from '../services/ticket-resolution.service.ts'

export namespace GetTicketById {
  /**
   * Request DTO for getting a ticket by ID or alias
   */
  export interface Request {
    readonly identifier: string
  }

  /**
   * Response DTO for ticket retrieval
   */
  export type Response = TicketResponse

  /**
   * Use case for retrieving a ticket by its ID or alias.
   * Returns null if ticket is not found.
   */
  export class UseCase extends BaseUseCase<Request, Response | null> {
    private readonly resolutionService: TicketResolutionService

    constructor(private readonly ticketRepository: TicketRepository) {
      super()
      this.resolutionService = new TicketResolutionService(ticketRepository)
    }

    public readonly auditMetadata: AuditMetadata = {
      operationId: 'ticket.read',
      operationType: 'read',
      resourceType: 'Ticket',
      description: 'Retrieves a ticket by its ID or alias',

      extractBeforeState: async (request: Request) => {
        // For read operations, we can capture what was requested
        return {
          requestedIdentifier: request.identifier,
        }
      },

      extractAfterState: async (request: Request, response: Response | null) => {
        // After read, capture what was returned
        if (!response) {
          return {
            found: false,
            requestedIdentifier: request.identifier,
          }
        }
        return {
          found: true,
          ticketId: response.id,
          title: response.title,
          status: response.status,
        }
      },
    }

    async execute(request: Request): Promise<Response | null> {
      this.logger.info('Starting ticket retrieval', {
        ticketIdentifier: request.identifier,
      })

      // Resolve ticket by ID or alias
      const { ticket, resolvedBy } = await this.resolutionService.resolveTicket(request.identifier)

      if (!ticket) {
        this.logger.info('Ticket not found', {
          ticketIdentifier: request.identifier,
        })
        return null
      }

      const response = createTicketResponse(ticket)

      this.logger.info('Ticket retrieval successful', {
        ticketId: response.id,
        ticketIdentifier: request.identifier,
        title: response.title,
        resolvedBy,
      })

      return response
    }
  }
}
