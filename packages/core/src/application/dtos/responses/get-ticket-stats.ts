import type { TicketStats } from '@project-manager/shared'

export class GetTicketStatsResponse {
  constructor(public readonly stats: TicketStats) {}

  static fromTicketStats(stats: TicketStats): GetTicketStatsResponse {
    return new GetTicketStatsResponse(stats)
  }
}
