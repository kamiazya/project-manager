import { type CreateTicketData, Ticket } from '../../domain/entities/ticket.ts'
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
      public readonly priority?: 'high' | 'medium' | 'low',
      public readonly type?: 'feature' | 'bug' | 'task',
      public readonly privacy?: 'local-only' | 'shareable' | 'public'
    ) {}

    /**
     * Convert request to domain create data
     */
    toCreateTicketData(): CreateTicketData {
      return {
        title: this.title,
        description: this.description,
        priority: this.priority || 'medium',
        type: this.type || 'task',
        privacy: this.privacy || 'local-only',
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

// Export the main use case class for compatibility
export const CreateTicketUseCase = CreateTicket.UseCase
export const CreateTicketRequest = CreateTicket.Request
export const CreateTicketResponse = CreateTicket.Response
