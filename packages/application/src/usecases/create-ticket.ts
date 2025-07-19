import { type CreateTicketData, Ticket } from '@project-manager/domain'
import type { UseCase as IUseCase } from '../common/base-usecase.ts'
import { TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

export namespace CreateTicket {
  /**
   * Request DTO for creating a new ticket
   */
  export class Request {
    constructor(
      public readonly title: string,
      public readonly description: string,
      public readonly priority: string,
      public readonly type: string,
      public readonly status: string
    ) {}

    /**
     * Convert request to domain create data
     */
    toCreateTicketData(): CreateTicketData {
      // Validate priority
      const priority = this.priority

      return {
        title: this.title,
        description: this.description,
        priority: priority,
        type: this.type,
        status: this.status,
      }
    }
  }

  /**
   * Response DTO for ticket creation
   */
  export class Response extends TicketResponse {}

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
      return TicketResponse.fromTicket(ticket) as Response
    }
  }
}
