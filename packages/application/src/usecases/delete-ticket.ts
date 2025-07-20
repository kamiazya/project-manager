import { TicketId } from '@project-manager/domain'
import type { UseCase as IUseCase } from '../common/base-usecase.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

export namespace DeleteTicket {
  export interface Request {
    readonly id: string
  }

  /**
   * Use case for deleting a ticket.
   */
  export class UseCase implements IUseCase<Request, void> {
    constructor(private readonly ticketRepository: TicketRepository) {}

    async execute(request: Request): Promise<void> {
      const ticketId = TicketId.create(request.id)
      await this.ticketRepository.delete(ticketId)
    }
  }
}
