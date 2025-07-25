/**
 * Interface for generating unique IDs
 *
 * This abstraction provides a domain-agnostic ID generation service
 * that can be used throughout the application for various entities.
 *
 * Uses ULID (Universally Unique Lexicographically Sortable Identifier)
 * for distributed system compatibility and database performance.
 *
 * @example
 * ```typescript
 * // In use case
 * const id = this.idGenerator.generateId()
 * const ticket = Ticket.create(id, title, description)
 * ```
 */
export interface IdGenerator {
  /**
   * Generate a unique ULID
   *
   * @returns A unique 26-character ULID string (Base32 encoded)
   * @throws {IdGenerationError} If ID generation fails
   */
  generateId(): string
}
