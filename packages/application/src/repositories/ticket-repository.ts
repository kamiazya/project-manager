import type { Ticket, TicketId } from '@project-manager/domain'

/**
 * Unified criteria for querying and searching tickets
 * Supports both basic filtering and text-based search
 */
export interface TicketQueryCriteria {
  status?: string
  priority?: string
  type?: string
  search?: string
  searchIn?: string[]
  limit?: number
  offset?: number
}

/**
 * Repository interface for Ticket aggregate
 * Uses domain objects (value objects) instead of primitives
 */
export interface TicketRepository {
  /**
   * Save a ticket to the repository
   * @param ticket - The ticket to save
   * @returns Promise that resolves when the ticket is saved
   */
  save(ticket: Ticket): Promise<void>
  /**
   * Find a ticket by its ID
   * @param id - The ID of the ticket to find
   * @returns The ticket if found, null otherwise
   */
  findById(id: TicketId): Promise<Ticket | null>
  /**
   * Find all tickets in the repository
   * @returns Array of all tickets
   */
  /**
   * Query tickets based on criteria (criteria is optional, returns all if omitted)
   * @param criteria - The criteria to filter and search tickets
   * @returns Array of tickets matching the criteria
   */
  queryTickets(criteria?: TicketQueryCriteria): Promise<Ticket[]>
  delete(id: TicketId): Promise<void>

  // Alias-related methods
  /**
   * Find a ticket by any of its aliases (canonical or custom)
   * @param alias - The alias to search for (case-insensitive)
   * @returns The ticket if found, null otherwise
   */
  findByAlias(alias: string): Promise<Ticket | null>

  /**
   * Check if an alias is available (not used by any ticket)
   * @param alias - The alias to check (case-insensitive)
   * @returns True if available, false if already in use
   */
  isAliasAvailable(alias: string): Promise<boolean>

  /**
   * Get all aliases in use across all tickets
   * @returns Array of all aliases currently in use
   */
  getAllAliases(): Promise<string[]>

  /**
   * Find tickets that have any aliases (canonical or custom)
   * @returns Array of tickets with at least one alias
   */
  findTicketsWithAliases(): Promise<Ticket[]>
}
