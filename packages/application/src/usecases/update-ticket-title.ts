import { TicketId } from '@project-manager/domain'
import type { UseCase as IUseCase } from '../common/base-usecase.ts'
import { TicketNotFoundError } from '../common/errors/application-errors.js'
import { createTicketResponse, type TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

export namespace UpdateTicketTitle {
  /**
   * Request DTO for updating ticket title
   */
  export class Request {
    constructor(
      public readonly id: string,
      public readonly newTitle: string
    ) {}
  }

  /**
   * Response DTO for title update result
   */
  export type Response = TicketResponse

  /**
   * Use case for updating a ticket's title.
   */
  export class UseCase implements IUseCase<Request, Response> {
    constructor(private readonly ticketRepository: TicketRepository) {}

    async execute(request: Request): Promise<Response> {
      const ticketId = TicketId.create(request.id)
      const ticket = await this.ticketRepository.findById(ticketId)

      if (!ticket) {
        throw new TicketNotFoundError(request.id, 'UpdateTicketTitle')
      }

      // Use domain method for business logic
      ticket.updateTitle(request.newTitle)

      await this.ticketRepository.save(ticket)
      return createTicketResponse(ticket)
    }
  }
}
