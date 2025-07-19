import type { TicketPriorityKey, TicketStatusKey, TicketTypeKey } from '../types/ticket-types.ts'
import {
  createTicketPriority,
  createTicketStatus,
  createTicketType,
} from '../types/ticket-types.ts'
import { TicketDescription } from '../value-objects/ticket-description.ts'
import { TicketId } from '../value-objects/ticket-id.ts'
import { TicketTitle } from '../value-objects/ticket-title.ts'

export interface TicketProps {
  id: TicketId
  title: TicketTitle
  type: TicketTypeKey
  description?: TicketDescription
  status: TicketStatusKey
  priority: TicketPriorityKey
  createdAt: Date
  updatedAt: Date
}

export interface CreateTicketData {
  title: string
  priority: string
  type: string
  status: string
  description?: string
}

export interface ReconstituteTicketData {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  type: string
  createdAt: string
  updatedAt: string
}

/**
 * Ticket entity following DDD principles
 * Encapsulates business rules and maintains invariants
 */
export class Ticket {
  private readonly props: TicketProps

  private constructor(props: TicketProps) {
    this.props = props
  }

  /**
   * Factory method for creating a new ticket
   */
  public static create(data: CreateTicketData): Ticket {
    const now = new Date()

    return new Ticket({
      id: TicketId.create(),
      title: TicketTitle.create(data.title),
      description: data.description ? TicketDescription.create(data.description) : undefined,
      status: createTicketStatus(data.status),
      priority: createTicketPriority(data.priority),
      type: createTicketType(data.type),
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
      description: data.description ? TicketDescription.create(data.description) : undefined,
      status: createTicketStatus(data.status),
      priority: createTicketPriority(data.priority),
      type: createTicketType(data.type),
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

  get description(): TicketDescription | undefined {
    return this.props.description
  }

  get status(): TicketStatusKey {
    return this.props.status
  }

  get priority(): TicketPriorityKey {
    return this.props.priority
  }

  get type(): TicketTypeKey {
    return this.props.type
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
  public changeStatus(newStatus: TicketStatusKey): void {
    this.props.status = newStatus
    this.updateTimestamp()
  }

  /**
   * Business operation: Change ticket priority
   */
  public changePriority(newPriority: TicketPriorityKey): void {
    this.props.priority = newPriority
    this.updateTimestamp()
  }

  /**
   * Business operation: Change ticket type
   */
  public changeType(newType: TicketTypeKey): void {
    this.props.type = newType
    this.updateTimestamp()
  }

  private updateTimestamp(): void {
    const now = new Date()
    const minTimestamp = new Date(this.props.updatedAt.getTime() + 1)
    this.props.updatedAt = now > minTimestamp ? now : minTimestamp
  }
}
