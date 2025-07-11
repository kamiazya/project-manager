import {
  ERROR_MESSAGES,
  TicketValidationError,
  VALIDATION,
  ValueObject,
} from '@project-manager/shared'

interface TicketDescriptionProps {
  value: string
}

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
      throw new TicketValidationError(ERROR_MESSAGES.DESCRIPTION_EMPTY, 'description')
    }

    if (trimmed.length > VALIDATION.DESCRIPTION_MAX_LENGTH) {
      throw new TicketValidationError(
        ERROR_MESSAGES.DESCRIPTION_TOO_LONG(VALIDATION.DESCRIPTION_MAX_LENGTH),
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
