import type { TicketPriority as TicketPriorityType } from '@project-manager/shared'
import { ValueObject } from '@project-manager/shared'

interface TicketPriorityProps {
  value: TicketPriorityType
}

/**
 * Value object representing a Ticket Priority
 * Encapsulates priority levels and comparison logic
 */
export class TicketPriority extends ValueObject<TicketPriorityProps> {
  private static readonly VALID_PRIORITIES: ReadonlySet<TicketPriorityType> = new Set([
    'high',
    'medium',
    'low',
  ])

  private static readonly PRIORITY_WEIGHTS: Record<TicketPriorityType, number> = {
    high: 3,
    medium: 2,
    low: 1,
  }

  get value(): TicketPriorityType {
    return this.props.value
  }

  private constructor(props: TicketPriorityProps) {
    super(props)
  }

  /**
   * Create a TicketPriority with validation
   */
  public static create(value: TicketPriorityType): TicketPriority {
    if (!TicketPriority.VALID_PRIORITIES.has(value)) {
      throw new Error(`Invalid ticket priority: ${value}`)
    }
    return new TicketPriority({ value })
  }

  /**
   * Create a high priority
   */
  public static high(): TicketPriority {
    return new TicketPriority({ value: 'high' })
  }

  /**
   * Create a medium priority (default)
   */
  public static medium(): TicketPriority {
    return new TicketPriority({ value: 'medium' })
  }

  /**
   * Create a low priority
   */
  public static low(): TicketPriority {
    return new TicketPriority({ value: 'low' })
  }

  /**
   * Compare with another priority
   * Returns positive if this priority is higher, negative if lower, 0 if equal
   */
  public compareTo(other: TicketPriority): number {
    const thisWeight = TicketPriority.PRIORITY_WEIGHTS[this.value]
    const otherWeight = TicketPriority.PRIORITY_WEIGHTS[other.value]
    return thisWeight - otherWeight
  }

  /**
   * Check if this priority is higher than another
   */
  public isHigherThan(other: TicketPriority): boolean {
    return this.compareTo(other) > 0
  }

  /**
   * Check if this priority is lower than another
   */
  public isLowerThan(other: TicketPriority): boolean {
    return this.compareTo(other) < 0
  }

  public toString(): string {
    return this.value
  }
}
