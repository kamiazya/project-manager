import type { UseCase } from '../common/base-usecase.ts'
import { GetTicketStatsRequest } from '../dtos/requests/get-ticket-stats.ts'
import { GetTicketStatsResponse } from '../dtos/responses/get-ticket-stats.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

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
