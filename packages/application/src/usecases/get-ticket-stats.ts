import type { UseCase as IUseCase } from '../common/base-usecase.ts'
import type { TicketStatistics } from '../common/ticket-statistics.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

export namespace GetTicketStats {
  /**
   * Request DTO for getting ticket statistics
   */
  export class Request {
    constructor() {}
  }

  /**
   * Response DTO for ticket statistics
   */
  export class Response {
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

    static fromTicketStats(stats: TicketStatistics): Response {
      return new Response(
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
  export class UseCase implements IUseCase<Request, Response> {
    constructor(private readonly ticketRepository: TicketRepository) {}

    async execute(_request: Request): Promise<Response> {
      const stats = await this.ticketRepository.getStatistics()
      return Response.fromTicketStats(stats)
    }
  }
}
