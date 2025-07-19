import { type CreateTicketData, Ticket } from '@project-manager/domain'
import type { UseCase as IUseCase } from '../common/base-usecase.ts'
import { createTicketResponse, type TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

export namespace CreateTicket {
  /**
   * Request DTO for creating a new ticket
   */
  export class Request {
    constructor(
      public readonly title: string,
      public readonly priority: string,
      public readonly type: string,
      public readonly status: string,
      public readonly description?: string
    ) {}

    /**
     * Convert request to domain create data
     */
    toCreateTicketData(): CreateTicketData {
      return {
        title: this.title.trim(), // Normalize title
        description: this.description?.trim(),
        priority: this.priority,
        type: this.type,
        status: this.status || 'pending', // Default status for new tickets
      }
    }
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
    constructor(private readonly ticketRepository: TicketRepository) {}

    async execute(request: Request): Promise<Response> {
      // Use domain entity factory method
      const ticket = Ticket.create(request.toCreateTicketData())

      // Persist through repository
      await this.ticketRepository.save(ticket)

      // Return response DTO
      return createTicketResponse(ticket)
    }
  }
}
