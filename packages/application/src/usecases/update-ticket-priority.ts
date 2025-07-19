import { createTicketPriority, TicketId, type TicketPriorityKey } from '@project-manager/domain'
import type { UseCase as IUseCase } from '../common/base-usecase.ts'
import { TicketNotFoundError } from '../common/errors/application-errors.js'
import { createTicketResponse, type TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

export namespace UpdateTicketPriority {
  /**
   * Request DTO for updating ticket priority
   */
  export class Request {
    public readonly validatedPriority: TicketPriorityKey

    constructor(
      public readonly id: string,
      public readonly newPriority: string
    ) {
      // Validate priority immediately upon construction
      this.validatedPriority = createTicketPriority(newPriority)
    }
  }

  /**
   * Response DTO for priority update result
   */
  export type Response = TicketResponse

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

      // Use the validated priority from the Request DTO
      ticket.changePriority(request.validatedPriority)

      await this.ticketRepository.save(ticket)
      return createTicketResponse(ticket)
    }
  }
}
