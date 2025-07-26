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
  private readonly description: string

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
    this.description = `Tail-based generator (${aliasLength} chars from ULID random part)`
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

  /**
   * Validate if a string could be a valid tail-based alias
   */
  validate(alias: string): boolean {
    if (alias.length !== this.aliasLength) {
      return false
    }

    // Check if it contains only valid Base32 characters (Crockford Base32)
    // ULID uses: 0123456789ABCDEFGHJKMNPQRSTVWXYZ (case insensitive)
    const validBase32Pattern = /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]+$/i
    return validBase32Pattern.test(alias)
  }

  /**
   * Get the minimum length of aliases from this generator
   */
  getMinLength(): number {
    return this.aliasLength
  }

  /**
   * Get the maximum length of aliases from this generator
   */
  getMaxLength(): number {
    return this.aliasLength
  }

  /**
   * Get a human-readable description of this generator
   */
  getDescription(): string {
    return this.description
  }

  /**
   * Calculate collision probability for a given number of tickets
   *
   * This uses the birthday paradox formula to estimate collision risk:
   * P(collision) ≈ 1 - e^(-n²/2d)
   * where n = number of tickets, d = keyspace size
   *
   * @param ticketCount - Number of tickets
   * @returns Collision probability as a decimal (0-1)
   */
  calculateCollisionProbability(ticketCount: number): number {
    // Base32 keyspace size for given length: 32^length
    const keyspaceSize = 32 ** this.aliasLength

    // Birthday paradox approximation
    const exponent = -(ticketCount * ticketCount) / (2 * keyspaceSize)
    return 1 - Math.exp(exponent)
  }

  /**
   * Get recommended ticket count for acceptable collision risk
   *
   * @param maxAcceptableRisk - Maximum acceptable collision probability (default: 0.01 = 1%)
   * @returns Recommended maximum number of tickets
   */
  getRecommendedTicketLimit(maxAcceptableRisk: number = 0.01): number {
    const keyspaceSize = 32 ** this.aliasLength

    // Solve for n in: risk = 1 - e^(-n²/2d)
    // Rearranged: n = sqrt(-2d * ln(1 - risk))
    const maxTickets = Math.sqrt(-2 * keyspaceSize * Math.log(1 - maxAcceptableRisk))

    return Math.floor(maxTickets)
  }

  /**
   * Get statistics about this generator's capacity
   */
  getCapacityStats(): {
    aliasLength: number
    keyspaceSize: number
    recommendedLimit: number
    collision1Percent: number
    collision10Percent: number
  } {
    const keyspaceSize = 32 ** this.aliasLength

    return {
      aliasLength: this.aliasLength,
      keyspaceSize,
      recommendedLimit: this.getRecommendedTicketLimit(0.01),
      collision1Percent: this.getRecommendedTicketLimit(0.01),
      collision10Percent: this.getRecommendedTicketLimit(0.1),
    }
  }
}
