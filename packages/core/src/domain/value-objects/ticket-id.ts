import {
  ERROR_MESSAGES,
  generateId,
  isValidId,
  VALIDATION,
  ValueObject,
} from '@project-manager/shared'

interface TicketIdProps {
  value: string
}

/**
 * Value object representing a Ticket ID
 * Ensures the ID follows the expected format and length constraints
 */
export class TicketId extends ValueObject<TicketIdProps> {
  get value(): string {
    return this.props.value
  }

  private constructor(props: TicketIdProps) {
    super(props)
  }

  /**
   * Create a new TicketId
   * @param id - Optional ID value. If not provided, generates a new one
   * @throws {Error} If the provided ID doesn't meet validation rules
   */
  public static create(id?: string): TicketId {
    const value = id || generateId()

    // Check if the ID matches the expected format (8 hex characters)
    if (!isValidId(value)) {
      throw new Error(ERROR_MESSAGES.INVALID_ID_FORMAT)
    }

    return new TicketId({ value })
  }

  /**
   * Reconstitute a TicketId from persistence
   * Assumes the ID is already valid (used when loading from storage)
   */
  public static fromValue(value: string): TicketId {
    return new TicketId({ value })
  }

  public toString(): string {
    return this.value
  }
}
