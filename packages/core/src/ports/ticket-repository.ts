import type { TicketSearchCriteria } from '@project-manager/shared'
import type { Ticket } from '../entities/ticket.js'

/**
 * Repository interface for ticket persistence operations.
 * This interface defines the contract for ticket data access,
 * following the Repository pattern from Domain-Driven Design.
 *
 * Implementations of this interface are responsible for:
 * - Persistence and retrieval of ticket entities
 * - Search and filtering operations
 * - Data consistency and integrity
 *
 * This interface belongs to the Domain layer and should not
 * depend on any specific infrastructure concerns.
 */
export interface ITicketRepository {
  /**
   * Saves a ticket to the repository.
   * Creates a new ticket if it doesn't exist, updates if it does.
   *
   * @param ticket - The ticket entity to save
   * @throws {StorageError} When the save operation fails
   */
  save(ticket: Ticket): Promise<void>

  /**
   * Finds a ticket by its ID.
   *
   * @param id - The unique identifier of the ticket
   * @returns The ticket entity
   * @throws {TicketNotFoundError} When the ticket doesn't exist
   * @throws {ValidationError} When the ID format is invalid
   */
  findById(id: string): Promise<Ticket>

  /**
   * Finds a ticket by its ID, returning null if not found.
   * This is a convenience method for cases where absence is not an error.
   *
   * @param id - The unique identifier of the ticket
   * @returns The ticket entity or null if not found
   * @throws {ValidationError} When the ID format is invalid
   */
  findByIdOrNull(id: string): Promise<Ticket | null>

  /**
   * Retrieves all tickets from the repository.
   *
   * @returns Array of all ticket entities
   */
  findAll(): Promise<Ticket[]>

  /**
   * Searches for tickets based on the provided criteria.
   * Multiple criteria are combined with AND logic.
   *
   * @param criteria - Search criteria for filtering tickets
   * @returns Array of tickets matching the criteria
   */
  search(criteria: TicketSearchCriteria): Promise<Ticket[]>

  /**
   * Updates an existing ticket in the repository.
   *
   * @param ticket - The ticket entity to update
   * @throws {TicketNotFoundError} When the ticket doesn't exist
   * @throws {StorageError} When the update operation fails
   */
  update(ticket: Ticket): Promise<void>

  /**
   * Deletes a ticket from the repository.
   *
   * @param id - The unique identifier of the ticket to delete
   * @throws {TicketNotFoundError} When the ticket doesn't exist
   * @throws {ValidationError} When the ID format is invalid
   * @throws {StorageError} When the delete operation fails
   */
  delete(id: string): Promise<void>

  /**
   * Checks if a ticket with the given ID exists.
   *
   * @param id - The unique identifier to check
   * @returns True if the ticket exists, false otherwise
   * @throws {ValidationError} When the ID format is invalid
   */
  exists(id: string): Promise<boolean>

  /**
   * Returns the total number of tickets in the repository.
   *
   * @returns The count of tickets
   */
  count(): Promise<number>

  /**
   * Removes all tickets from the repository.
   * This operation should be used with caution.
   *
   * @throws {StorageError} When the clear operation fails
   */
  clear(): Promise<void>
}
