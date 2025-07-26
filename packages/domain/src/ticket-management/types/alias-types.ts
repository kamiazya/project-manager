import { TicketAlias } from '../value-objects/ticket-alias.ts'

/**
 * Type of alias - canonical (system-generated) or custom (user-defined)
 */
export type AliasType = 'canonical' | 'custom'

/**
 * Branded type for alias type to prevent mixing with regular strings
 */
export type AliasTypeKey = AliasType

/**
 * Collection of aliases for a ticket
 *
 * A ticket can have:
 * - One canonical alias (system-generated)
 * - Zero or more custom aliases (user-defined)
 */
export interface TicketAliasCollection {
  /**
   * The system-generated default alias
   * This is created when the ticket is first accessed and never changes
   */
  canonical?: TicketAlias

  /**
   * User-defined custom aliases
   * Users can add multiple custom aliases for easier reference
   */
  custom: TicketAlias[]
}

/**
 * Metadata for alias storage and tracking
 */
export interface AliasMetadata {
  /**
   * The alias value
   */
  alias: string

  /**
   * The ticket ID this alias points to
   */
  ticketId: string

  /**
   * Type of alias (canonical or custom)
   */
  type: 'canonical' | 'custom'

  /**
   * When this alias was created
   */
  createdAt: Date

  /**
   * The strategy used to generate this alias (for canonical aliases)
   */
  generatorStrategy?: string
}
