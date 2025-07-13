import { Ticket } from '../../domain/entities/ticket.js'
import type { UseCase } from '../common/base-usecase.js'
import { CreateTicketRequest } from '../dtos/requests/create-ticket.js'
import { CreateTicketResponse } from '../dtos/responses/create-ticket.js'
import { TicketResponse } from '../dtos/responses/ticket.js'
import type { TicketRepository } from '../repositories/ticket-repository.js'

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
