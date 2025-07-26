import { TicketId } from '../value-objects/ticket-id.ts'

/**
 * Interface for generating ticket aliases
 *
 * Different implementations can provide various alias generation strategies:
 * - TailBasedAliasGenerator: Uses the last N characters of the ULID
 * - HaikunatorAliasGenerator: Generates human-readable names (future)
 * - CustomPatternGenerator: User-defined patterns (future)
 */
export interface AliasGenerator {
  /**
   * Generate an alias for a given ticket ID
   *
   * @param ticketId - The ticket's ULID
   * @returns A generated alias string
   */
  generate(ticketId: TicketId): string

  /**
   * Validate if a string is a valid alias according to this generator's rules
   *
   * @param alias - The alias to validate
   * @returns True if the alias is valid
   */
  validate(alias: string): boolean

  /**
   * Get the minimum expected length of aliases from this generator
   * Used for collision detection and storage optimization
   */
  getMinLength(): number

  /**
   * Get the maximum expected length of aliases from this generator
   * Used for validation and storage optimization
   */
  getMaxLength(): number

  /**
   * Get a human-readable description of this generator's strategy
   * Used for documentation and user communication
   */
  getDescription(): string
}
