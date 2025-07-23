import { randomBytes } from 'node:crypto'
import type { IdGenerator } from '@project-manager/application'

/**
 * Infrastructure-specific error for ID generation operations
 */
class IdGenerationError extends Error {
  public readonly cause?: Error

  constructor(message: string, options?: { cause?: Error }) {
    super(message)
    this.name = 'IdGenerationError'
    this.cause = options?.cause

    // Maintains proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, IdGenerationError.prototype)

    // Capture stack trace if available
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, IdGenerationError.prototype.constructor)
    }
  }
}

/**
 * Cryptographically secure ID generator using Node.js crypto module
 *
 * This implementation uses Node.js's built-in crypto module to generate
 * collision-resistant IDs that can be used throughout the application.
 *
 * @example
 * ```typescript
 * const generator = new CryptoIdGenerator()
 * const id = generator.generateId() // Returns "a1b2c3d4"
 * ```
 */
export class CryptoIdGenerator implements IdGenerator {
  /**
   * Generate a unique ID
   *
   * Uses crypto.randomBytes to create a 8-character hex string using
   * cryptographically strong randomness for collision resistance.
   *
   * @returns A unique 8-character hexadecimal string
   * @throws {IdGenerationError} If ID generation fails
   */
  generateId(): string {
    try {
      // Use crypto for robust, collision-resistant IDs
      return randomBytes(4).toString('hex')
    } catch (error) {
      throw new IdGenerationError('Failed to generate ID', {
        cause: error as Error,
      })
    }
  }
}
