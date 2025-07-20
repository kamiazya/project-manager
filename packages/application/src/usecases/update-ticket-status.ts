import { createTicketStatus, TicketId, type TicketStatusKey } from '@project-manager/domain'
import type { UseCase as IUseCase } from '../common/base-usecase.ts'
import { TicketNotFoundError } from '../common/errors/application-errors.js'
import { createTicketResponse, type TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

export namespace UpdateTicketStatus {
  /**
   * Request DTO for updating ticket status
   */
  export interface Request {
    readonly id: string
    readonly newStatus: string
  }

  /**
   * Response DTO for status update result
   */
  export type Response = TicketResponse

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

      // Validate and create status
      const validatedStatus = createTicketStatus(request.newStatus)
      ticket.changeStatus(validatedStatus)

      await this.ticketRepository.save(ticket)
      return createTicketResponse(ticket)
    }
  }
}
