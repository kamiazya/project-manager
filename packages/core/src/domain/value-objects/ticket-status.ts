import type { TicketStatus as TicketStatusType } from '../types/ticket-types.ts'
import { ValueObject } from './base-value-object.ts'

interface TicketStatusProps {
  value: TicketStatusType
}

/**
 * Value object representing a Ticket Status
 * Encapsulates status transition rules and validation
 */
export class TicketStatus extends ValueObject<TicketStatusProps> {
  private static readonly VALID_STATUSES: ReadonlySet<TicketStatusType> = new Set([
    'pending',
    'in_progress',
    'completed',
    'archived',
  ])

  private static readonly TRANSITIONS: Record<TicketStatusType, TicketStatusType[]> = {
    pending: ['in_progress', 'archived'],
    in_progress: ['pending', 'completed', 'archived'],
    completed: ['in_progress', 'archived'],
    archived: [], // No transitions from archived
  }

  get value(): TicketStatusType {
    return this.props.value
  }

  private constructor(props: TicketStatusProps) {
    super(props)
  }

  /**
   * Create a TicketStatus with validation
   */
  public static create(value: TicketStatusType): TicketStatus {
    if (!TicketStatus.VALID_STATUSES.has(value)) {
      throw new Error(`Invalid ticket status: ${value}`)
    }
    return new TicketStatus({ value })
  }

  /**
   * Create a pending status (default for new tickets)
   */
  public static pending(): TicketStatus {
    return new TicketStatus({ value: 'pending' })
  }

  /**
   * Create an in_progress status
   */
  public static inProgress(): TicketStatus {
    return new TicketStatus({ value: 'in_progress' })
  }

  /**
   * Create a completed status
   */
  public static completed(): TicketStatus {
    return new TicketStatus({ value: 'completed' })
  }

  /**
   * Create an archived status
   */
  public static archived(): TicketStatus {
    return new TicketStatus({ value: 'archived' })
  }

  /**
   * Check if transition to another status is allowed
   */
  public canTransitionTo(newStatus: TicketStatusType): boolean {
    const allowedTransitions = TicketStatus.TRANSITIONS[this.value]
    return allowedTransitions.includes(newStatus)
  }

  /**
   * Check if the ticket is in a final state
   */
  public isFinal(): boolean {
    return this.value === 'completed' || this.value === 'archived'
  }

  /**
   * Check if the ticket is active (not archived)
   */
  public isActive(): boolean {
    return this.value !== 'archived'
  }

  public toString(): string {
    return this.value
  }
}
