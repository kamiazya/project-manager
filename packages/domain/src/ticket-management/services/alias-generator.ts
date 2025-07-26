import { TicketId } from '../value-objects/ticket-id.ts'

/**
 * Interface for generating ticket aliases
 *
 * Implementations provide alias generation strategies for tickets.
 * The primary implementation is TailBasedAliasGenerator which uses
 * the last N characters of the ULID.
 */
export interface AliasGenerator {
  /**
   * Generate an alias for a given ticket ID
   *
   * @param ticketId - The ticket's ULID
   * @returns A generated alias string
   */
  generate(ticketId: TicketId): string
}
