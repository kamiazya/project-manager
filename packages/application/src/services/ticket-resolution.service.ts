import { type Ticket, TicketId } from '@project-manager/domain'
import { TicketNotFoundError } from '../common/errors/application-errors.ts'
import type { TicketRepository } from '../repositories/ticket-repository.ts'

/**
 * Result of ticket resolution with match details
 */

/**
 * How a ticket was resolved (by id, alias, or partial match)
 */
export type TicketResolutionType = 'id' | 'alias' | 'partial_id' | 'partial_alias'

/**
 * A single match result for a ticket (by id or alias)
 */
export interface TicketMatchResult {
  ticket: Ticket
  matchType: 'id' | 'alias'
  matchedValue: string
}

/**
 * Represents the result of attempting to resolve a ticket.
 */
export interface TicketResolutionResult {
  /**
   * The resolved ticket, or `null` if no ticket was resolved.
   */
  ticket: Ticket | null
  /**
   * The method or type used to resolve the ticket, or `null` if unresolved.
   */
  resolvedBy: TicketResolutionType | null
  /**
   * The original identifier used to attempt ticket resolution.
   */
  originalIdentifier: string
  /**
   * Optional array of potential ticket match results, if applicable.
   */
  matches?: TicketMatchResult[]
}

/**
 * Service for resolving tickets by ID or alias with flexible partial matching
 * Implements the business logic for ticket identification resolution
 *
 * Resolution Strategy:
 * 1. Exact ID match (ULID)
 * 2. Exact alias match
 * 3. Prefix matching for IDs (if unambiguous)
 * 4. Prefix matching for aliases (if unambiguous)
 * 5. Error with suggestions if multiple matches found
 */
export class TicketResolutionService {
  constructor(private readonly ticketRepository: TicketRepository) {}

  /**
   * Resolve a ticket by ID or alias with flexible partial matching
   * @param identifier - Full or partial ULID string or alias string
   * @returns TicketResolutionResult with resolution details
   * @throws TicketNotFoundError with suggestions if multiple matches found
   */
  async resolveTicket(identifier: string): Promise<TicketResolutionResult> {
    // Strategy 1: Try exact ID match first
    const ticketById = await this.tryFindById(identifier)
    if (ticketById) {
      return {
        ticket: ticketById,
        resolvedBy: 'id',
        originalIdentifier: identifier,
      }
    }

    // Strategy 2: Try exact alias match
    const ticketByAlias = await this.tryFindByAlias(identifier)
    if (ticketByAlias) {
      return {
        ticket: ticketByAlias,
        resolvedBy: 'alias',
        originalIdentifier: identifier,
      }
    }

    // Strategy 3: Try prefix matching
    const prefixResult = await this.tryPrefixMatching(identifier)
    if (prefixResult.ticket) {
      return prefixResult
    }

    // No matches found
    return {
      ticket: null,
      resolvedBy: null,
      originalIdentifier: identifier,
    }
  }

  /**
   * Try prefix matching for both IDs and aliases
   * @param identifier - Partial identifier to match
   * @returns TicketResolutionResult with single match or multiple matches
   * @throws TicketNotFoundError if multiple matches found
   */
  private async tryPrefixMatching(identifier: string): Promise<TicketResolutionResult> {
    // Get all tickets to search through
    const allTickets = await this.ticketRepository.queryTickets()
    const matches: Array<{
      ticket: Ticket
      matchType: 'id' | 'alias'
      matchedValue: string
    }> = []

    // Search for ID prefix matches
    for (const ticket of allTickets) {
      const ticketIdStr = ticket.id.value
      if (ticketIdStr.toLowerCase().startsWith(identifier.toLowerCase())) {
        matches.push({
          ticket,
          matchType: 'id',
          matchedValue: ticketIdStr,
        })
      }
    }

    // Search for alias prefix matches
    for (const ticket of allTickets) {
      const aliases = ticket.getAllAliases()
      for (const aliasValue of aliases) {
        if (aliasValue.toLowerCase().startsWith(identifier.toLowerCase())) {
          // Check if we already have this ticket from ID matching
          const existingMatch = matches.find(m => m.ticket.id.value === ticket.id.value)
          if (!existingMatch) {
            matches.push({
              ticket,
              matchType: 'alias',
              matchedValue: aliasValue,
            })
          }
        }
      }
    }

    // Handle results based on match count
    if (matches.length === 0) {
      return {
        ticket: null,
        resolvedBy: null,
        originalIdentifier: identifier,
      }
    }

    if (matches.length === 1) {
      const match = matches[0]!
      return {
        ticket: match.ticket,
        resolvedBy: match.matchType === 'id' ? 'partial_id' : 'partial_alias',
        originalIdentifier: identifier,
      }
    }

    // Multiple matches found - throw error with suggestions
    const suggestions = matches
      .map(m => `  ${m.matchedValue} (${m.matchType === 'id' ? 'ID' : 'alias'})`)
      .join('\n')
    throw new TicketNotFoundError(
      `Multiple tickets match "${identifier}":\n${suggestions}\n\nPlease use a more specific identifier.`
    )
  }

  /**
   * Check if an identifier is a valid ULID format
   */
  isValidUlid(identifier: string): boolean {
    try {
      TicketId.create(identifier)
      return true
    } catch {
      return false
    }
  }

  /**
   * Try to find ticket by ID (ULID format)
   */
  private async tryFindById(identifier: string): Promise<Ticket | null> {
    try {
      const ticketId = TicketId.create(identifier)
      return await this.ticketRepository.findById(ticketId)
    } catch {
      // If not a valid ULID, return null
      return null
    }
  }

  /**
   * Try to find ticket by alias
   */
  private async tryFindByAlias(identifier: string): Promise<Ticket | null> {
    try {
      return await this.ticketRepository.findByAlias(identifier)
    } catch {
      // If alias lookup fails, return null
      return null
    }
  }
}
