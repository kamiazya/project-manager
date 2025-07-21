import { randomBytes } from 'node:crypto'
import { IdGenerator } from '@project-manager/application'
import { InfrastructureError } from '../errors/infrastructure-errors.ts'

/**
 * Cryptographically secure ID generator using Node.js crypto module
 *
 * This implementation uses Node.js's built-in crypto module to generate
 * collision-resistant IDs for domain entities.
 *
 * @example
 * ```typescript
 * const generator = new CryptoIdGenerator()
 * const id = generator.generateTicketIdSync() // Returns "a1b2c3d4"
 * ```
 */
export class CryptoIdGenerator implements IdGenerator {
  /**
   * Generate a unique ID for tickets (async version)
   *
   * @returns Promise resolving to a unique 8-character hexadecimal string
   * @throws {InfrastructureError} If ID generation fails
   */
  async generateTicketId(): Promise<string> {
    try {
      return this.generateTicketIdSync()
    } catch (error) {
      throw new InfrastructureError('Failed to generate ticket ID', { cause: error })
    }
  }

  /**
   * Generate a unique ID for tickets (synchronous version)
   *
   * Uses crypto.randomBytes to create a 8-character hex string using
   * cryptographically strong randomness for collision resistance.
   *
   * @returns A unique 8-character hexadecimal string
   * @throws {InfrastructureError} If ID generation fails
   */
  generateTicketIdSync(): string {
    try {
      // Use crypto for robust, collision-resistant IDs
      return randomBytes(4).toString('hex')
    } catch (error) {
      throw new InfrastructureError('Failed to generate ticket ID synchronously', { cause: error })
    }
  }

  /**
   * Validate ID format (8 hex characters)
   *
   * @param id - ID to validate
   * @returns true if valid, false otherwise
   */
  static isValidTicketIdFormat(id: string): boolean {
    return /^[0-9a-f]{8}$/.test(id)
  }
}
