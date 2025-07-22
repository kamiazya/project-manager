import { PersistenceError } from '@project-manager/application'
import type { Logger } from '@project-manager/base/common/logging'
import { Ticket } from '@project-manager/domain'
import type { TicketJSON } from '../../types/persistence-types.ts'

/**
 * Infrastructure-specific error for mapper operations
 * Concrete implementation of InfrastructureError for the infrastructure layer
 */
class MapperInfrastructureError extends Error {
  public readonly context?: Record<string, unknown>
  public readonly cause?: Error

  constructor(message: string, options?: { cause?: Error; context?: Record<string, unknown> }) {
    super(message)
    this.name = 'InfrastructureError'
    this.context = options?.context
    this.cause = options?.cause

    // Maintains proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, MapperInfrastructureError.prototype)

    // Capture stack trace if available
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MapperInfrastructureError.prototype.constructor)
    }
  }
}

// Export for testing
export { MapperInfrastructureError as InfrastructureError }

/**
 * Convert a domain Ticket to persistence format (JSON)
 */
export function toPersistence(ticket: Ticket): TicketJSON {
  return {
    id: ticket.id.value,
    title: ticket.title.value,
    description: ticket.description?.value,
    status: ticket.status,
    priority: ticket.priority,
    type: ticket.type,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  }
}

/**
 * Convert persistence format (JSON) to domain Ticket
 *
 * Handles domain validation failures gracefully by wrapping them in
 * infrastructure-specific errors with contextual information.
 *
 * @param json - Raw persistence data
 * @returns Domain Ticket object
 * @throws {PersistenceError} When persistence data is malformed or missing required fields
 * @throws {InfrastructureError} When domain validation fails during reconstitution
 */
export function toDomain(json: TicketJSON): Ticket {
  try {
    // Validate that required persistence fields are present
    validatePersistenceData(json)

    // Attempt domain reconstitution with validation
    return Ticket.reconstitute({
      id: json.id,
      title: json.title,
      description: json.description,
      status: json.status,
      priority: json.priority,
      type: json.type,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    })
  } catch (error) {
    if (error instanceof PersistenceError) {
      // Re-throw persistence validation errors
      throw error
    }

    // Wrap domain validation errors with context
    if (error instanceof Error) {
      throw new MapperInfrastructureError(
        `Failed to reconstitute ticket from persistence data: ${error.message}`,
        {
          cause: error,
          context: {
            ticketId: json.id,
            persistenceData: sanitizeForLogging(json),
            operation: 'toDomain',
          },
        }
      )
    }

    // Handle unexpected errors
    throw new MapperInfrastructureError('Unexpected error during ticket reconstitution', {
      cause: error as Error,
      context: {
        ticketId: json.id,
        operation: 'toDomain',
      },
    })
  }
}

/**
 * Convert an array of persistence format to domain objects
 *
 * Handles individual item failures gracefully while preserving valid tickets.
 * Invalid tickets are logged but don't prevent processing of valid ones.
 *
 * @param jsonList - Array of raw persistence data
 * @param logger - Optional logger for warnings and errors
 * @returns Array of valid domain Ticket objects (excluding invalid ones)
 * @throws {InfrastructureError} When all tickets fail validation or unexpected errors occur
 */
export function toDomainList(jsonList: TicketJSON[], logger?: Logger): Ticket[] {
  const validTickets: Ticket[] = []
  const errors: Array<{ ticketId: string; error: Error }> = []

  for (const json of jsonList) {
    try {
      const ticket = toDomain(json)
      validTickets.push(ticket)
    } catch (error) {
      // Log individual failures but continue processing
      const ticketId = typeof json?.id === 'string' ? json.id : 'unknown'
      const errorInstance =
        error instanceof Error ? error : new MapperInfrastructureError(String(error))

      errors.push({ ticketId, error: errorInstance })

      // Log for monitoring/debugging
      if (logger) {
        logger.warn(`Skipping invalid ticket during bulk reconstitution: ${ticketId}`, {
          error: errorInstance.message,
          ticketId,
        })
      }
    }
  }

  // If all tickets failed, throw an error
  if (validTickets.length === 0 && jsonList.length > 0) {
    throw new MapperInfrastructureError(
      `All ${jsonList.length} tickets failed validation during reconstitution`,
      {
        context: {
          totalTickets: jsonList.length,
          failedTickets: errors.length,
          firstError: errors[0]?.error.message,
          operation: 'toDomainList',
        },
      }
    )
  }

  // Log summary if there were partial failures
  if (errors.length > 0 && logger) {
    logger.warn(
      `Partial failure during bulk ticket reconstitution: ${errors.length}/${jsonList.length} tickets failed`,
      {
        successCount: validTickets.length,
        errorCount: errors.length,
        totalCount: jsonList.length,
      }
    )
  }

  return validTickets
}

/**
 * Convert an array of domain objects to persistence format
 */
export function toPersistenceList(tickets: Ticket[]): TicketJSON[] {
  return tickets.map(ticket => toPersistence(ticket))
}

/**
 * Validate that persistence data contains required fields
 *
 * @param json - Raw persistence data to validate
 * @throws {PersistenceError} When required fields are missing or invalid
 */
function validatePersistenceData(json: unknown): asserts json is TicketJSON {
  if (!json || typeof json !== 'object') {
    throw new PersistenceError(
      'validatePersistenceData',
      'Persistence data must be a valid object',
      'Ticket',
      { receivedType: typeof json, operation: 'validatePersistenceData' }
    )
  }

  const data = json as Record<string, unknown>

  // Validate required string fields
  const requiredStringFields = [
    'id',
    'title',
    'status',
    'priority',
    'type',
    'createdAt',
    'updatedAt',
  ]

  for (const field of requiredStringFields) {
    if (!data[field] || typeof data[field] !== 'string') {
      throw new PersistenceError(
        'validatePersistenceData',
        `Missing or invalid required field: ${field}`,
        'Ticket',
        {
          field,
          receivedValue: data[field],
          receivedType: typeof data[field],
          operation: 'validatePersistenceData',
        }
      )
    }
  }

  // Validate optional description field (can be string or undefined)
  if (data.description !== undefined && typeof data.description !== 'string') {
    throw new PersistenceError(
      'validatePersistenceData',
      'Description field must be a string when present',
      'Ticket',
      {
        field: 'description',
        receivedValue: data.description,
        receivedType: typeof data.description,
        operation: 'validatePersistenceData',
      }
    )
  }

  // Validate date format for timestamp fields
  const dateFields = ['createdAt', 'updatedAt']
  for (const field of dateFields) {
    const dateValue = data[field] as string
    if (isNaN(Date.parse(dateValue))) {
      throw new PersistenceError(
        'validatePersistenceData',
        `Invalid date format in field: ${field}`,
        'Ticket',
        {
          field,
          receivedValue: dateValue,
          operation: 'validatePersistenceData',
        }
      )
    }
  }
}

/**
 * Sanitize persistence data for safe logging (removes potentially sensitive information)
 *
 * @param json - Raw persistence data
 * @returns Sanitized data safe for logging
 */
function sanitizeForLogging(json: TicketJSON): Record<string, unknown> {
  return {
    id: json.id,
    titleLength: json.title?.length || 0,
    hasDescription: !!json.description,
    descriptionLength: json.description?.length || 0,
    status: json.status,
    priority: json.priority,
    type: json.type,
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
  }
}
