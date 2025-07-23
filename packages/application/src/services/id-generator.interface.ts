/**
 * Interface for generating unique IDs
 *
 * This abstraction provides a domain-agnostic ID generation service
 * that can be used throughout the application for various entities.
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
   * Generate a unique ID
   *
   * @returns A unique 8-character hexadecimal string
   * @throws {Error} If ID generation fails
   */
  generateId(): string
}
