import { Ticket } from '../../domain/entities/ticket.ts'
import type { UseCase } from '../common/base-usecase.ts'
import { CreateTicketRequest } from '../dtos/requests/create-ticket.ts'
import { CreateTicketResponse } from '../dtos/responses/create-ticket.ts'
import { TicketResponse } from '../dtos/responses/ticket.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

/**
 * Use case for creating a new ticket.
 * Follows the Single Responsibility Principle with focused responsibility.
 */
export class CreateTicketUseCase implements UseCase<CreateTicketRequest, CreateTicketResponse> {
  constructor(private readonly ticketRepository: TicketRepository) {}

  async execute(request: CreateTicketRequest): Promise<CreateTicketResponse> {
    // Use domain entity factory method
    const ticket = Ticket.create(request.toCreateTicketData())

    // Persist through repository
    await this.ticketRepository.save(ticket)

    return TicketResponse.fromTicket(ticket) as CreateTicketResponse
  }
}
