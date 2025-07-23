import { TicketId } from '@project-manager/domain'
import { createTicketResponse, type TicketResponse } from '../common/ticket.response.ts'
import type { ApplicationLogger, AuditableUseCase, AuditMetadata } from '../logging/index.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

export namespace GetTicketById {
  /**
   * Request DTO for getting a ticket by ID
   */
  export interface Request {
    readonly id: string
  }

  /**
   * Response DTO for ticket retrieval
   */
  export type Response = TicketResponse

  /**
   * Use case for retrieving a ticket by its ID.
   * Returns null if ticket is not found.
   */
  export class UseCase implements AuditableUseCase<Request, Response | null> {
    public logger!: ApplicationLogger // Injected by framework

    public readonly auditMetadata: AuditMetadata = {
      operationId: 'ticket.read',
      operationType: 'read',
      resourceType: 'Ticket',
      description: 'Retrieves a ticket by its ID',
      useCaseName: 'GetTicketById',

      extractBeforeState: async (request: Request) => {
        // For read operations, we can capture what was requested
        return {
          requestedId: request.id,
        }
      },

      extractAfterState: async (request: Request, response: Response | null) => {
        // After read, capture what was returned
        if (!response) {
          return {
            found: false,
            requestedId: request.id,
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

    constructor(private readonly ticketRepository: TicketRepository) {}

    async execute(request: Request): Promise<Response | null> {
      await this.logger.info('Starting ticket retrieval', {
        ticketId: request.id,
      })

      const ticketId = TicketId.create(request.id)
      const ticket = await this.ticketRepository.findById(ticketId)

      if (!ticket) {
        await this.logger.info('Ticket not found', {
          ticketId: request.id,
        })
        return null
      }

      const response = createTicketResponse(ticket)

      await this.logger.info('Ticket retrieval successful', {
        ticketId: response.id,
        title: response.title,
      })

      return response
    }
  }
}
