import type { UseCase } from '../common/base-usecase.ts'
import type { TicketStatistics } from '../common/ticket-statistics.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

// Temporary compatibility classes until namespace conversion
class GetTicketStatsRequest {
  constructor() {}
}

class GetTicketStatsResponse {
  constructor(
    public readonly total: number,
    public readonly pending: number,
    public readonly inProgress: number,
    public readonly completed: number,
    public readonly archived: number,
    public readonly byPriority: { high: number; medium: number; low: number },
    public readonly byType: { feature: number; bug: number; task: number }
  ) {}

  // For backward compatibility with existing code
  get stats() {
    return {
      total: this.total,
      pending: this.pending,
      inProgress: this.inProgress,
      completed: this.completed,
      archived: this.archived,
      byPriority: this.byPriority,
      byType: this.byType,
    }
  }

  static fromTicketStats(stats: TicketStatistics): GetTicketStatsResponse {
    return new GetTicketStatsResponse(
      stats.total,
      stats.pending,
      stats.inProgress,
      stats.completed,
      stats.archived,
      stats.byPriority,
      stats.byType
    )
  }
}

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
