import { ValueObject } from '../../shared/patterns/base-value-object.ts'
import type { TicketStatusKey } from '../types/ticket-types.ts'

interface TicketStatusProps {
  value: TicketStatusKey
}

/**
 * Value object representing a Ticket Status
 * Encapsulates status transition rules and validation
 */
export class TicketStatus extends ValueObject<TicketStatusProps> {
  get value(): TicketStatusKey {
    return this.props.value
  }

  private constructor(props: TicketStatusProps) {
    super(props)
  }

  /**
   * Create a TicketStatus with validation
   */
  public static create(value: TicketStatusKey): TicketStatus {
    return new TicketStatus({ value })
  }

  public toString(): string {
    return this.value
  }
}
