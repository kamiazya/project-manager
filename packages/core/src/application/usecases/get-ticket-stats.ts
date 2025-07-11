import type { TicketStats } from '@project-manager/shared'
import { inject, injectable } from 'inversify'
import type { UseCase } from '../common/base-usecase.js'
import { GetTicketStatsRequest } from '../dtos/requests/get-ticket-stats.js'
import { GetTicketStatsResponse } from '../dtos/responses/get-ticket-stats.js'
import {
  type TicketRepository,
  TicketRepository as TicketRepositorySymbol,
} from '../repositories/ticket-repository.js'

/**
 * Use case for retrieving ticket statistics.
 */
@injectable()
export class GetTicketStatsUseCase
  implements UseCase<GetTicketStatsRequest, GetTicketStatsResponse>
{
  constructor(
    @inject(TicketRepositorySymbol)
    private readonly ticketRepository: TicketRepository
  ) {}

  async execute(_request: GetTicketStatsRequest): Promise<GetTicketStatsResponse> {
    const tickets = await this.ticketRepository.findAll()

    const stats: TicketStats = {
      total: tickets.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
      archived: 0,
      byPriority: {
        high: 0,
        medium: 0,
        low: 0,
      },
      byType: {
        feature: 0,
        bug: 0,
        task: 0,
      },
    }

    for (const ticket of tickets) {
      // Count by status
      switch (ticket.status.value) {
        case 'pending':
          stats.pending++
          break
        case 'in_progress':
          stats.inProgress++
          break
        case 'completed':
          stats.completed++
          break
        case 'archived':
          stats.archived++
          break
      }

      // Count by priority
      switch (ticket.priority.value) {
        case 'high':
          stats.byPriority.high++
          break
        case 'medium':
          stats.byPriority.medium++
          break
        case 'low':
          stats.byPriority.low++
          break
      }

      // Count by type
      switch (ticket.type) {
        case 'feature':
          stats.byType.feature++
          break
        case 'bug':
          stats.byType.bug++
          break
        case 'task':
          stats.byType.task++
          break
      }
    }

    return GetTicketStatsResponse.fromTicketStats(stats)
  }
}
