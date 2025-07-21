/**
 * Interface for generating unique IDs for domain entities
 *
 * This abstraction allows the domain layer to remain pure by delegating
 * ID generation to the infrastructure layer through dependency inversion.
 *
 * @example
 * ```typescript
 * // In use case
 * const id = await this.idGenerator.generateTicketId()
 * const ticket = Ticket.create(id, title, description)
 * ```
 */
export interface IdGenerator {
  /**
   * Generate a unique ID for tickets
   *
   * @returns Promise resolving to a unique 8-character hexadecimal string
   * @throws {Error} If ID generation fails
   */
  generateTicketId(): Promise<string>

  /**
   * Generate a unique ID for tickets (synchronous version)
   *
   * @returns A unique 8-character hexadecimal string
   * @throws {Error} If ID generation fails
   */
  generateTicketIdSync(): string
}
