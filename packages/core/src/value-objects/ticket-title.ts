import {
  ERROR_MESSAGES,
  TicketValidationError,
  VALIDATION,
  ValueObject,
} from '@project-manager/shared'

interface TicketTitleProps {
  value: string
}

/**
 * Value object representing a Ticket Title
 * Ensures the title is not empty and meets length constraints
 */
export class TicketTitle extends ValueObject<TicketTitleProps> {
  get value(): string {
    return this.props.value
  }

  private constructor(props: TicketTitleProps) {
    super(props)
  }

  /**
   * Create a new TicketTitle
   * @param value - The title string
   * @throws {TicketValidationError} If the title doesn't meet validation rules
   */
  public static create(value: string): TicketTitle {
    const trimmed = value.trim()

    if (trimmed.length === 0) {
      throw new TicketValidationError(ERROR_MESSAGES.TITLE_EMPTY, 'title')
    }

    if (trimmed.length > VALIDATION.TITLE_MAX_LENGTH) {
      throw new TicketValidationError(
        ERROR_MESSAGES.TITLE_TOO_LONG(VALIDATION.TITLE_MAX_LENGTH),
        'title'
      )
    }

    return new TicketTitle({ value: trimmed })
  }

  /**
   * Get a truncated version of the title for display
   * @param maxLength - Maximum length for display (default from constants)
   */
  public toDisplay(maxLength: number = VALIDATION.TITLE_DISPLAY_MAX_LENGTH): string {
    if (this.value.length <= maxLength) {
      return this.value
    }
    return `${this.value.substring(0, maxLength - 3)}...`
  }

  public toString(): string {
    return this.value
  }
}
