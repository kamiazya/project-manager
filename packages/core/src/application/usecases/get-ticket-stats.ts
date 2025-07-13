import type { UseCase } from '../common/base-usecase.js'
import { GetTicketStatsRequest } from '../dtos/requests/get-ticket-stats.js'
import { GetTicketStatsResponse } from '../dtos/responses/get-ticket-stats.js'
import type { TicketRepository } from '../repositories/ticket-repository.js'

/**
 * Use case for retrieving ticket statistics.
 */
export class GetTicketStatsUseCase
  implements UseCase<GetTicketStatsRequest, GetTicketStatsResponse>
{
  constructor(private readonly ticketRepository: TicketRepository) {}

  async execute(_request: GetTicketStatsRequest): Promise<GetTicketStatsResponse> {
    const stats = await this.ticketRepository.getStatistics()
    return GetTicketStatsResponse.fromTicketStats(stats)
  }
}
