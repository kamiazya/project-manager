import { ValidationError } from '@project-manager/base'
import type { AliasGenerator } from '@project-manager/domain'
import { TicketId } from '@project-manager/domain'

/**
 * Generates aliases using the tail (random part) of ULID
 *
 * This strategy extracts the last N characters from the ULID's random section
 * to create collision-resistant aliases that avoid timestamp-based conflicts
 * common in bulk operations.
 *
 * ULID Structure:
 * - First 10 chars (48 bits): Timestamp (avoided to prevent bulk collision)
 * - Last 16 chars (80 bits): Random data (used for alias generation)
 *
 * Example:
 * ULID: 01H8XGJWBWBAQ1J3T3B8A0V0A8
 * Generated alias: B8A0V0A8 (last 8 characters)
 */
export class TailBasedAliasGenerator implements AliasGenerator {
  private readonly aliasLength: number

  /**
   * Create a tail-based alias generator
   *
   * @param aliasLength - Number of characters to extract from the tail (default: 8)
   */
  constructor(aliasLength: number = 8) {
    if (aliasLength < 4) {
      throw new ValidationError(
        'Alias length must be at least 4 characters for adequate collision resistance'
      )
    }

    if (aliasLength > 16) {
      throw new ValidationError('Alias length cannot exceed 16 characters (ULID random part limit)')
    }

    this.aliasLength = aliasLength
  }

  /**
   * Generate an alias from the ticket ID's random tail
   */
  generate(ticketId: TicketId): string {
    const ulidString = ticketId.value

    // Validate ULID format (26 characters)
    if (ulidString.length !== 26) {
      throw new ValidationError(
        `Invalid ULID format: expected 26 characters, got ${ulidString.length}`
      )
    }

    // Extract the tail (random part) from ULID
    // ULID format: TTTTTTTTTTRRRRRRRRRRRRRRRR
    // T = Timestamp part (first 10 chars)
    // R = Random part (last 16 chars)
    const randomPart = ulidString.slice(-16) // Last 16 characters
    const alias = randomPart.slice(-this.aliasLength) // Take last N characters

    return alias.toLowerCase()
  }
}
