import { TicketId } from '../../domain/value-objects/ticket-id.js'
import type { UseCase } from '../common/base-usecase.js'
import { DeleteTicketRequest } from '../dtos/requests/delete-ticket.js'
import { DeleteTicketResponse } from '../dtos/responses/delete-ticket.js'
import type { TicketRepository } from '../repositories/ticket-repository.js'

/**
 * Use case for deleting a ticket.
 */
export class DeleteTicketUseCase implements UseCase<DeleteTicketRequest, DeleteTicketResponse> {
  constructor(private readonly ticketRepository: TicketRepository) {}

  async execute(request: DeleteTicketRequest): Promise<DeleteTicketResponse> {
    const ticketId = TicketId.create(request.id)
    await this.ticketRepository.delete(ticketId)

    return DeleteTicketResponse.success(request.id)
  }
}
