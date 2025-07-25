import { ValidationError } from '@project-manager/base'
import { ValueObject } from '../../shared/patterns/base-value-object.ts'

interface TicketIdProps {
  value: string
}

const INVALID_ID_FORMAT = 'Ticket ID must be a valid ULID (26 characters, Base32 encoded)'

/**
 * Validate ULID format (26 Base32 characters)
 * ULID uses Crockford Base32: 0123456789ABCDEFGHJKMNPQRSTVWXYZ
 * Excludes: I, L, O, U to avoid ambiguity
 */
function isValidId(id: string): boolean {
  return /^[0-9A-HJKMNP-TV-Z]{26}$/.test(id)
}

/**
 * Value object representing a Ticket ID
 *
 * Uses ULID (Universally Unique Lexicographically Sortable Identifier) format
 * for distributed systems compatibility and database performance.
 *
 * This is a pure value object that only handles validation and encapsulation.
 * ID generation is delegated to the infrastructure layer via IdGenerator service
 * to maintain Clean Architecture principles and avoid external dependencies.
 */
export class TicketId extends ValueObject<TicketIdProps> {
  get value(): string {
    return this.props.value
  }

  private constructor(props: TicketIdProps) {
    super(props)
  }

  /**
   * Create a TicketId from an existing ID value
   * @param id - ULID string that must meet validation rules
   * @throws {ValidationError} If the provided ID doesn't meet ULID format requirements
   */
  public static create(id: string): TicketId {
    // Check if the ID matches the expected ULID format (26 Base32 characters)
    if (!isValidId(id)) {
      throw new ValidationError(INVALID_ID_FORMAT, 'ticketId', id)
    }

    return new TicketId({ value: id })
  }

  /**
   * Reconstitute a TicketId from persistence
   * Assumes the ID is already valid (used when loading from storage)
   *
   * @param value - Previously validated ID value
   * @returns TicketId instance
   */
  public static fromValue(value: string): TicketId {
    return new TicketId({ value })
  }

  /**
   * Get the string representation of the ID
   * @returns The ID value as a string
   */
  public toString(): string {
    return this.value
  }
}
