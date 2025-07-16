import { TicketId } from '../../domain/value-objects/ticket-id.ts'
import type { UseCase } from '../common/base-usecase.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

// Temporary compatibility classes until namespace conversion
class DeleteTicketRequest {
  constructor(public readonly id: string) {}
}

class DeleteTicketResponse {
  constructor(
    public readonly id: string,
    public readonly success: boolean
  ) {}

  static success(id: string): DeleteTicketResponse {
    return new DeleteTicketResponse(id, true)
  }
}

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
