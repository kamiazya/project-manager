import { TicketId } from '../../domain/value-objects/ticket-id.ts'
import type { UseCase as IUseCase } from '../common/base-usecase.ts'
import { TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

export namespace GetTicketById {
  /**
   * Request DTO for getting a ticket by ID
   */
  export class Request {
    constructor(public readonly id: string) {}
  }

  /**
   * Response DTO for ticket retrieval
   */
  export class Response extends TicketResponse {}

  /**
   * Use case for retrieving a ticket by its ID.
   * Returns null if ticket is not found.
   */
  export class UseCase implements IUseCase<Request, Response | null> {
    constructor(private readonly ticketRepository: TicketRepository) {}

    async execute(request: Request): Promise<Response | null> {
      const ticketId = TicketId.create(request.id)
      const ticket = await this.ticketRepository.findById(ticketId)

      if (!ticket) {
        return null
      }

      return TicketResponse.fromTicket(ticket) as Response
    }
  }
}

// Export the main use case class for compatibility
export const GetTicketByIdUseCase = GetTicketById.UseCase
export const GetTicketByIdRequest = GetTicketById.Request
export const GetTicketByIdResponse = GetTicketById.Response
