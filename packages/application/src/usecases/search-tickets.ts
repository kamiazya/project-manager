import type { Ticket } from '@project-manager/domain'
import { createTicketResponse, type TicketResponse } from '../common/ticket.response.ts'
import type { ApplicationLogger, AuditableUseCase, AuditMetadata } from '../logging/index.ts'
import type { TicketQueryCriteria, TicketRepository } from '../repositories/ticket-repository.ts'

export namespace SearchTickets {
  /**
   * Search and filter criteria for finding tickets
   * Supports both basic filtering and text-based search
   */
  export interface SearchCriteria {
    status?: string
    priority?: string
    type?: string
    search?: string
    searchIn?: string[]
    limit?: number
    offset?: number
  }

  /**
   * Request DTO for searching and filtering tickets
   */
  export interface Request {
    readonly criteria?: SearchCriteria
  }

  /**
   * Response DTO for search results
   */
  export class Response {
    constructor(public readonly tickets: TicketResponse[]) {}

    static fromTickets(tickets: Ticket[]): Response {
      return new Response(tickets.map(ticket => createTicketResponse(ticket)))
    }
  }

  /**
   * Use case for searching and filtering tickets.
   * Handles both text-based search and basic filtering.
   * If no criteria are provided, returns all tickets.
   */
  export class UseCase implements AuditableUseCase<Request, Response> {
    public logger!: ApplicationLogger // Injected by framework

    public readonly auditMetadata: AuditMetadata = {
      operationId: 'ticket.search',
      operationType: 'search',
      resourceType: 'Ticket',
      description: 'Searches and filters tickets based on criteria',
      useCaseName: 'SearchTickets',

      extractBeforeState: async (request: Request) => {
        // For search operations, capture the search criteria
        return {
          criteria: request.criteria || {},
          searchQuery: request.criteria?.search,
          filters: {
            status: request.criteria?.status,
            priority: request.criteria?.priority,
            type: request.criteria?.type,
          },
        }
      },

      extractAfterState: async (request: Request, response: Response) => {
        // After search, capture results summary
        return {
          resultCount: response.tickets.length,
          hasResults: response.tickets.length > 0,
          limit: request.criteria?.limit,
          offset: request.criteria?.offset,
        }
      },
    }

    constructor(private readonly ticketRepository: TicketRepository) {}

    async execute(request: Request): Promise<Response> {
      const criteria = request.criteria || {}

      await this.logger.info('Starting ticket search', {
        hasSearchQuery: !!criteria.search,
        hasFilters: !!(criteria.status || criteria.priority || criteria.type),
        limit: criteria.limit,
        offset: criteria.offset,
      })

      // Convert to repository criteria format
      const queryCriteria: TicketQueryCriteria = {
        status: criteria.status,
        priority: criteria.priority,
        type: criteria.type,
        search: criteria.search,
        searchIn: criteria.searchIn,
        limit: criteria.limit,
        offset: criteria.offset,
      }

      await this.logger.debug('Executing repository query', {
        criteria: queryCriteria,
      })

      const tickets = await this.ticketRepository.queryTickets(queryCriteria)
      const response = Response.fromTickets(tickets)

      await this.logger.info('Ticket search completed', {
        resultCount: response.tickets.length,
        hasMoreResults: tickets.length === (criteria.limit || 0),
      })

      return response
    }
  }
}
