import { ERROR_MESSAGES, generateId, VALIDATION, ValueObject } from '@project-manager/shared'

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

    if (value.length < VALIDATION.TICKET_ID_MIN_LENGTH) {
      throw new Error(ERROR_MESSAGES.ID_TOO_SHORT(VALIDATION.TICKET_ID_MIN_LENGTH))
    }

    if (value.length > VALIDATION.TICKET_ID_MAX_LENGTH) {
      throw new Error(ERROR_MESSAGES.ID_TOO_LONG(VALIDATION.TICKET_ID_MAX_LENGTH))
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
