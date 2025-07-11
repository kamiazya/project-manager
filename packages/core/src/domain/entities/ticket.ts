import type { TicketPrivacy, TicketType } from '@project-manager/shared'
import { DEFAULTS, TicketValidationError } from '@project-manager/shared'
import type { DomainEvent } from '../domain-events/domain-event.js'
import { TicketDescription } from '../value-objects/ticket-description.js'
import { TicketId } from '../value-objects/ticket-id.js'
import { TicketPriority } from '../value-objects/ticket-priority.js'
import { TicketStatus } from '../value-objects/ticket-status.js'
import { TicketTitle } from '../value-objects/ticket-title.js'

export interface TicketProps {
  id: TicketId
  title: TicketTitle
  description: TicketDescription
  status: TicketStatus
  priority: TicketPriority
  type: TicketType
  privacy: TicketPrivacy
  createdAt: Date
  updatedAt: Date
}

export interface CreateTicketData {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  type?: TicketType
  privacy?: TicketPrivacy
  status?: 'pending' | 'in_progress' | 'completed' | 'archived'
}

export interface ReconstituteTicketData {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'archived'
  priority: 'high' | 'medium' | 'low'
  type: TicketType
  privacy: TicketPrivacy
  createdAt: string
  updatedAt: string
}

/**
 * Ticket entity following DDD principles
 * Encapsulates business rules and maintains invariants
 */
export class Ticket {
  private readonly props: TicketProps
  private readonly _domainEvents: DomainEvent[] = []

  private constructor(props: TicketProps) {
    this.props = props
  }

  /**
   * Get domain events (for future event sourcing capabilities)
   */
  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents]
  }

  /**
   * Clear domain events (typically called after events are dispatched)
   */
  public clearEvents(): void {
    this._domainEvents.length = 0
  }

  /**
   * Factory method for creating a new ticket
   */
  public static create(data: CreateTicketData): Ticket {
    const now = new Date()

    return new Ticket({
      id: TicketId.create(),
      title: TicketTitle.create(data.title),
      description: TicketDescription.create(data.description),
      status: data.status ? TicketStatus.create(data.status) : TicketStatus.pending(),
      priority: TicketPriority.create(data.priority),
      type: data.type || DEFAULTS.TYPE,
      privacy: data.privacy || DEFAULTS.PRIVACY,
      createdAt: now,
      updatedAt: now,
    })
  }

  /**
   * Factory method for reconstituting a ticket from persistence
   */
  public static reconstitute(data: ReconstituteTicketData): Ticket {
    return new Ticket({
      id: TicketId.fromValue(data.id),
      title: TicketTitle.create(data.title),
      description: TicketDescription.create(data.description),
      status: TicketStatus.create(data.status),
      priority: TicketPriority.create(data.priority),
      type: data.type,
      privacy: data.privacy,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    })
  }

  // Getters for accessing properties
  get id(): TicketId {
    return this.props.id
  }

  get title(): TicketTitle {
    return this.props.title
  }

  get description(): TicketDescription {
    return this.props.description
  }

  get status(): TicketStatus {
    return this.props.status
  }

  get priority(): TicketPriority {
    return this.props.priority
  }

  get type(): TicketType {
    return this.props.type
  }

  get privacy(): TicketPrivacy {
    return this.props.privacy
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  /**
   * Business operation: Update ticket title
   */
  public updateTitle(newTitle: string): void {
    this.props.title = TicketTitle.create(newTitle)
    this.updateTimestamp()
  }

  /**
   * Business operation: Update ticket description
   */
  public updateDescription(newDescription: string): void {
    this.props.description = TicketDescription.create(newDescription)
    this.updateTimestamp()
  }

  /**
   * Business operation: Change ticket status
   */
  public changeStatus(newStatus: 'pending' | 'in_progress' | 'completed' | 'archived'): void {
    const targetStatus = TicketStatus.create(newStatus)

    if (!this.props.status.canTransitionTo(newStatus)) {
      throw new TicketValidationError(
        `Cannot transition from ${this.props.status.value} to ${newStatus}`,
        'status'
      )
    }

    this.props.status = targetStatus
    this.updateTimestamp()
  }

  /**
   * Business operation: Change ticket priority
   */
  public changePriority(newPriority: 'high' | 'medium' | 'low'): void {
    this.props.priority = TicketPriority.create(newPriority)
    this.updateTimestamp()
  }

  /**
   * Business operation: Start progress on the ticket
   */
  public startProgress(): void {
    this.changeStatus('in_progress')
  }

  /**
   * Business operation: Complete the ticket
   */
  public complete(): void {
    this.changeStatus('completed')
  }

  /**
   * Business operation: Archive the ticket
   */
  public archive(): void {
    this.changeStatus('archived')
  }

  /**
   * Check if the ticket is in a final state
   */
  public isFinalized(): boolean {
    return this.props.status.isFinal()
  }

  /**
   * Check if the ticket is active
   */
  public isActive(): boolean {
    return this.props.status.isActive()
  }

  private updateTimestamp(): void {
    this.props.updatedAt = new Date()
  }
}
