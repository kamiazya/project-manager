import { TicketId } from '@project-manager/domain'
import { ERROR_MESSAGES, TicketNotFoundError } from '@project-manager/shared'
import type { UseCase as IUseCase } from '../common/base-usecase.ts'
import { TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

export namespace StartTicketProgress {
  /**
   * Request DTO for starting ticket progress
   */
  export class Request {
    constructor(public readonly id: string) {}
  }

  /**
   * Response DTO for progress start result
   */
  export class Response extends TicketResponse {}

  /**
   * Use case for starting progress on a ticket.
   */
  export class UseCase implements IUseCase<Request, Response> {
    constructor(private readonly ticketRepository: TicketRepository) {}

    async execute(request: Request): Promise<Response> {
      const ticketId = TicketId.create(request.id)
      const ticket = await this.ticketRepository.findById(ticketId)

      if (!ticket) {
        throw new TicketNotFoundError(ERROR_MESSAGES.TICKET_NOT_FOUND(request.id))
      }

      // Use domain business operation
      ticket.startProgress()

      await this.ticketRepository.save(ticket)
      return TicketResponse.fromTicket(ticket) as Response
    }
  }
}
