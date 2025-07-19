import { TicketId, type TicketStatusKey } from '@project-manager/domain'
import type { UseCase as IUseCase } from '../common/base-usecase.ts'
import { TicketNotFoundError } from '../common/errors/application-errors.js'
import { TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

export namespace UpdateTicketStatus {
  /**
   * Request DTO for updating ticket status
   */
  export class Request {
    constructor(
      public readonly id: string,
      public readonly newStatus: 'pending' | 'in_progress' | 'completed' | 'archived'
    ) {}
  }

  /**
   * Response DTO for status update result
   */
  export class Response extends TicketResponse {}

  /**
   * Use case for updating a ticket's status.
   */
  export class UseCase implements IUseCase<Request, Response> {
    constructor(private readonly ticketRepository: TicketRepository) {}

    async execute(request: Request): Promise<Response> {
      const ticketId = TicketId.create(request.id)
      const ticket = await this.ticketRepository.findById(ticketId)

      if (!ticket) {
        throw new TicketNotFoundError(request.id, 'UpdateTicketStatus')
      }

      // Use domain method for business logic (includes validation)
      ticket.changeStatus(request.newStatus as TicketStatusKey)

      await this.ticketRepository.save(ticket)
      return TicketResponse.fromTicket(ticket) as Response
    }
  }
}
