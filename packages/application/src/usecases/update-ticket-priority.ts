import { TicketId, type TicketPriorityKey } from '@project-manager/domain'
import type { UseCase as IUseCase } from '../common/base-usecase.ts'
import { TicketNotFoundError } from '../common/errors/application-errors.js'
import { TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

export namespace UpdateTicketPriority {
  export class Request {
    constructor(
      public readonly id: string,
      public readonly newPriority: 'high' | 'medium' | 'low'
    ) {}
  }

  export class Response extends TicketResponse {}

  /**
   * Use case for updating a ticket's priority.
   */
  export class UseCase implements IUseCase<Request, Response> {
    constructor(private readonly ticketRepository: TicketRepository) {}

    async execute(request: Request): Promise<Response> {
      const ticketId = TicketId.create(request.id)
      const ticket = await this.ticketRepository.findById(ticketId)

      if (!ticket) {
        throw new TicketNotFoundError(request.id, 'UpdateTicketPriority')
      }

      // Use domain method for business logic
      ticket.changePriority(request.newPriority as TicketPriorityKey)

      await this.ticketRepository.save(ticket)
      return TicketResponse.fromTicket(ticket) as Response
    }
  }
}
