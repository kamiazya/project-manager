import type { IdGenerator } from '@project-manager/application'
import { IdGenerationError } from '@project-manager/application'
import { ulid } from 'ulid'

/**
 * ULID-based ID generator for distributed systems
 *
 * This implementation uses ULID (Universally Unique Lexicographically Sortable Identifier)
 * to generate collision-resistant, sortable IDs that support multi-device synchronization
 * and provide optimal database performance.
 *
 * Key features:
 * - 128-bit identifier with 48-bit timestamp and 80-bit randomness
 * - Lexicographically sortable by creation time (k-sortable)
 * - Base32 encoded for human readability and URL safety
 * - Collision-resistant across distributed devices
 * - Compatible with Hybrid Logical Clock (HLC) patterns
 *
 * @example
 * ```typescript
 * const generator = new UlidIdGenerator()
 * const id = generator.generateId() // Returns "01ARZ3NDEKTSV4RRFFQ69G5FAV"
 * ```
 */
export class UlidIdGenerator implements IdGenerator {
  /**
   * Generate a unique ULID
   *
   * Uses the ULID library to create a 26-character Base32 encoded string
   * with cryptographically strong randomness and temporal ordering.
   *
   * @returns A unique 26-character ULID string
   * @throws {IdGenerationError} If ULID generation fails
   */
  generateId(): string {
    try {
      // Generate ULID with current timestamp and cryptographic randomness
      return ulid()
    } catch (error) {
      throw new IdGenerationError('Failed to generate ULID', undefined, error as Error)
    }
  }

  /**
   * Generate a ULID with a specific timestamp (for testing or special cases)
   *
   * @param timestamp - The timestamp to use for ULID generation
   * @returns A unique 26-character ULID string with the specified timestamp
   * @throws {IdGenerationError} If ULID generation fails
   */
  generateIdWithTimestamp(timestamp: number): string {
    try {
      return ulid(timestamp)
    } catch (error) {
      throw new IdGenerationError(
        `Failed to generate ULID with timestamp ${timestamp}`,
        { timestamp },
        error as Error
      )
    }
  }
}
