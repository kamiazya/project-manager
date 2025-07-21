import { Ticket, TicketId } from '@project-manager/domain'
import type { UseCase as IUseCase } from '../common/base-usecase.ts'
import { createTicketResponse, type TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'
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
  export class UseCase implements IUseCase<Request, Response> {
    constructor(
      private readonly ticketRepository: TicketRepository,
      private readonly idGenerator: IdGenerator
    ) {}

    async execute(request: Request): Promise<Response> {
      // Generate ID using infrastructure service
      const idValue = await this.idGenerator.generateTicketId()
      const ticketId = TicketId.create(idValue)

      // Use domain entity factory method with pre-generated ID
      const ticket = Ticket.create(ticketId, {
        title: request.title.trim(),
        description: request.description?.trim(),
        priority: request.priority || 'medium',
        type: request.type ?? 'task',
        status: request.status || 'pending',
      })

      // Persist through repository
      await this.ticketRepository.save(ticket)

      // Return response DTO
      return createTicketResponse(ticket)
    }
  }
}
