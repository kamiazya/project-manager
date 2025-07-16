import { VALIDATION } from '@project-manager/shared'
import { TicketValidationError } from '../types/ticket-types.ts'
import { ValueObject } from './base-value-object.ts'

interface TicketTitleProps {
  value: string
}

const TITLE_MAX_LENGTH = VALIDATION.TITLE_MAX_LENGTH
const TITLE_DISPLAY_MAX_LENGTH = VALIDATION.TITLE_DISPLAY_MAX_LENGTH
const TITLE_EMPTY_MESSAGE = 'Title cannot be empty or whitespace only'
const TITLE_TOO_LONG_MESSAGE = (max: number) => `Title cannot exceed ${max} characters`

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
      throw new TicketValidationError(TITLE_EMPTY_MESSAGE, 'title')
    }

    if (trimmed.length > TITLE_MAX_LENGTH) {
      throw new TicketValidationError(TITLE_TOO_LONG_MESSAGE(TITLE_MAX_LENGTH), 'title')
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
