import { TicketId } from '../../domain/value-objects/ticket-id.ts'
import type { UseCase } from '../common/base-usecase.ts'
import { DeleteTicketRequest } from '../dtos/requests/delete-ticket.ts'
import { DeleteTicketResponse } from '../dtos/responses/delete-ticket.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

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
