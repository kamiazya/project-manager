import { ValueObject } from '../../shared/patterns/base-value-object.ts'
import { TicketValidationError } from '../types/errors.ts'

interface TicketTitleProps {
  value: string
}

const TITLE_MAX_LENGTH = 200
const TITLE_DISPLAY_MAX_LENGTH = 40

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
      throw new TicketValidationError('Title cannot be empty or whitespace only', 'title')
    }

    if (trimmed.length > TITLE_MAX_LENGTH) {
      throw new TicketValidationError(`Title cannot exceed ${TITLE_MAX_LENGTH} characters`, 'title')
    }

    return new TicketTitle({ value: trimmed })
  }

  /**
   * Get a truncated version of the title for display
   * @param maxLength - Maximum length for display (default from constants)
   */
  public toDisplay(maxLength: number = TITLE_DISPLAY_MAX_LENGTH): string {
    if (maxLength <= 0) {
      return ''
    }

    if (this.value.length <= maxLength) {
      return this.value
    }

    if (maxLength <= 3) {
      return this.value.substring(0, maxLength)
    }

    return `${this.value.substring(0, maxLength - 3)}...`
  }

  public toString(): string {
    return this.value
  }
}
