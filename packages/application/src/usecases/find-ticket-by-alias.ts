import type { Ticket } from '@project-manager/domain'
import { BaseUseCase } from '../common/base-usecase.ts'
import { createTicketResponse, type TicketResponse } from '../common/ticket.response.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

/**
 * Request for finding a ticket by alias
 */
export interface FindTicketByAliasRequest {
  /**
   * The alias to search for (can be canonical or custom)
   */
  alias: string

  /**
   * Whether to perform case-sensitive search
   */
  caseSensitive?: boolean
}

/**
 * Response from finding a ticket by alias
 */
export interface FindTicketByAliasResponse {
  /**
   * The found ticket (null if not found)
   */
  ticket: TicketResponse | null

  /**
   * The alias that was used to find the ticket
   */
  searchAlias: string

  /**
   * The type of alias that matched
   */
  matchedAliasType?: 'canonical' | 'custom'

  /**
   * Whether the search was case-sensitive
   */
  caseSensitive: boolean
}

/**
 * Use case for finding tickets by their aliases
 *
 * This use case provides dedicated alias-based ticket search functionality,
 * separate from the general ticket resolution used by other operations.
 *
 * Business Rules:
 * - Searches both canonical and custom aliases
 * - Supports case-sensitive and case-insensitive search
 * - Returns the matched alias type for context
 * - Returns null if no ticket matches the alias
 * - Does not throw errors for non-existent aliases
 */
export class FindTicketByAliasUseCase extends BaseUseCase<
  FindTicketByAliasRequest,
  FindTicketByAliasResponse
> {
  constructor(private readonly ticketRepository: TicketRepository) {
    super()
  }

  /**
   * Execute the use case
   */
  async execute(request: FindTicketByAliasRequest): Promise<FindTicketByAliasResponse> {
    const caseSensitive = request.caseSensitive ?? false
    const searchAlias = caseSensitive ? request.alias : request.alias.toLowerCase()

    // Use repository's findByAlias method which handles both canonical and custom aliases
    const ticket = await this.ticketRepository.findByAlias(request.alias)

    if (!ticket) {
      return {
        ticket: null,
        searchAlias,
        caseSensitive,
      }
    }

    // Determine which type of alias matched
    const matchedAliasType = this.determineMatchedAliasType(ticket, request.alias, caseSensitive)

    return {
      ticket: createTicketResponse(ticket),
      searchAlias: searchAlias,
      matchedAliasType,
      caseSensitive,
    }
  }

  /**
   * Determine whether the alias matched a canonical or custom alias
   */
  private determineMatchedAliasType(
    ticket: Ticket,
    searchAlias: string,
    caseSensitive: boolean
  ): 'canonical' | 'custom' {
    const compareAlias = (aliasValue: string) => {
      return caseSensitive
        ? aliasValue === searchAlias
        : aliasValue.toLowerCase() === searchAlias.toLowerCase()
    }

    // Check canonical alias first
    if (ticket.aliases?.canonical && compareAlias(ticket.aliases.canonical.value)) {
      return 'canonical'
    }

    // Check custom aliases
    if (ticket.aliases?.custom) {
      for (const customAlias of ticket.aliases.custom) {
        if (compareAlias(customAlias.value)) {
          return 'custom'
        }
      }
    }

    // Fallback - this shouldn't happen if the ticket was found by alias
    return 'canonical'
  }
}
