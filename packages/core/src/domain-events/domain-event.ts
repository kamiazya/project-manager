/**
 * Base interface for domain events
 * Domain events represent important business happenings in the domain
 */
export interface DomainEvent {
  /**
   * Unique identifier for this event occurrence
   */
  readonly eventId: string

  /**
   * Timestamp when the event occurred
   */
  readonly occurredOn: Date

  /**
   * Type of the event for discrimination
   */
  readonly eventType: string
}

/**
 * Example domain event for ticket completion
 */
export interface TicketCompletedEvent extends DomainEvent {
  readonly eventType: 'TicketCompleted'
  readonly ticketId: string
  readonly title: string
  readonly completedAt: Date
}

/**
 * Example domain event for ticket status changes
 */
export interface TicketStatusChangedEvent extends DomainEvent {
  readonly eventType: 'TicketStatusChanged'
  readonly ticketId: string
  readonly fromStatus: string
  readonly toStatus: string
  readonly changedAt: Date
}
