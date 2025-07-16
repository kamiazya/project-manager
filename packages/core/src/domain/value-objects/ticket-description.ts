import { TicketValidationError } from '../types/ticket-types.ts'
import { ValueObject } from './base-value-object.ts'

interface TicketDescriptionProps {
  value: string
}

const DESCRIPTION_MAX_LENGTH = 5000
const DESCRIPTION_EMPTY_MESSAGE = 'Description cannot be empty'
const DESCRIPTION_TOO_LONG_MESSAGE = (max: number) => `Description cannot exceed ${max} characters`

/**
 * Value object representing a Ticket Description
 * Ensures the description meets length constraints
 */
export class TicketDescription extends ValueObject<TicketDescriptionProps> {
  get value(): string {
    return this.props.value
  }

  private constructor(props: TicketDescriptionProps) {
    super(props)
  }

  /**
   * Create a new TicketDescription
   * @param value - The description string
   * @throws {Error} If the description doesn't meet validation rules
   */
  public static create(value: string): TicketDescription {
    const trimmed = value.trim()

    if (trimmed.length === 0) {
      throw new TicketValidationError(DESCRIPTION_EMPTY_MESSAGE, 'description')
    }

    if (trimmed.length > DESCRIPTION_MAX_LENGTH) {
      throw new TicketValidationError(
        DESCRIPTION_TOO_LONG_MESSAGE(DESCRIPTION_MAX_LENGTH),
        'description'
      )
    }

    return new TicketDescription({ value: trimmed })
  }

  /**
   * Create an optional description (can be empty)
   */
  public static createOptional(value?: string): TicketDescription | undefined {
    if (!value || value.trim().length === 0) {
      return undefined
    }
    return TicketDescription.create(value)
  }

  public toString(): string {
    return this.value
  }
}
