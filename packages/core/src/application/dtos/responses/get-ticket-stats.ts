import type { TicketStatistics } from '../ticket-statistics.ts'

export class GetTicketStatsResponse {
  constructor(public readonly stats: TicketStatistics) {}

  static fromTicketStats(stats: TicketStatistics): GetTicketStatsResponse {
    return new GetTicketStatsResponse(stats)
  }
}
