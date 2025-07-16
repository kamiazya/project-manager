import { ERROR_MESSAGES, TicketNotFoundError } from '@project-manager/shared'
import { TicketId } from '../../domain/value-objects/ticket-id.ts'
import type { UseCase as IUseCase } from '../common/base-usecase.ts'
import { TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

export namespace CompleteTicket {
  export class Request {
    constructor(public readonly id: string) {}
  }

  export class Response extends TicketResponse {}

  /**
   * Use case for completing a ticket.
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
      ticket.complete()

      await this.ticketRepository.save(ticket)
      return TicketResponse.fromTicket(ticket) as Response
    }
  }
}
