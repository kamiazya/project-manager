import { ValueObject } from '../../shared/patterns/base-value-object.ts'
import { TicketValidationError } from '../types/errors.ts'

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
      throw new TicketValidationError(
        'Description cannot be empty or whitespace only',
        'description'
      )
    }

    if (trimmed.length > 5000) {
      throw new TicketValidationError('Description cannot exceed 5000 characters', 'description')
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
