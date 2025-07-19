import { TicketId } from '@project-manager/domain'
import type { UseCase as IUseCase } from '../common/base-usecase.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

export namespace DeleteTicket {
  export class Request {
    constructor(public readonly id: string) {}
  }

  export class Response {
    constructor(
      public readonly id: string,
      public readonly success: boolean
    ) {}

    static success(id: string): Response {
      return new Response(id, true)
    }
  }

  /**
   * Use case for deleting a ticket.
   */
  export class UseCase implements IUseCase<Request, Response> {
    constructor(private readonly ticketRepository: TicketRepository) {}

    async execute(request: Request): Promise<Response> {
      const ticketId = TicketId.create(request.id)
      await this.ticketRepository.delete(ticketId)

      return Response.success(request.id)
    }
  }
}
