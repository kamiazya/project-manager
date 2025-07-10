import type {
  TicketData,
  TicketJSON,
  TicketPriority,
  TicketPrivacy,
  TicketStatus,
  TicketType,
} from '@project-manager/shared'
import {
  DEFAULTS,
  ERROR_MESSAGES,
  generateId,
  TicketValidationError,
  VALIDATION,
} from '@project-manager/shared'

export class Ticket {
  public readonly id: string
  public readonly title: string
  public readonly description: string
  public status: TicketStatus
  public priority: TicketPriority
  public readonly type: TicketType
  public readonly privacy: TicketPrivacy
  public readonly createdAt: Date
  public updatedAt: Date

  constructor(data: TicketData, id?: string) {
    // Validate input data
    this.validateTicketData(data)

    this.id = id || generateId()
    this.title = data.title.trim()
    this.description = data.description.trim()
    this.status = data.status || DEFAULTS.STATUS
    this.priority = data.priority
    this.type = data.type || DEFAULTS.TYPE
    this.privacy = data.privacy || DEFAULTS.PRIVACY
    this.createdAt = new Date()
    this.updatedAt = new Date()
  }

  private validateTicketData(data: TicketData): void {
    // Validate title
    if (!data.title || typeof data.title !== 'string') {
      throw new TicketValidationError(ERROR_MESSAGES.TITLE_REQUIRED, 'title')
    }

    const trimmedTitle = data.title.trim()
    if (trimmedTitle.length === 0) {
      throw new TicketValidationError(ERROR_MESSAGES.TITLE_EMPTY, 'title')
    }

    if (trimmedTitle.length > VALIDATION.TITLE_MAX_LENGTH) {
      throw new TicketValidationError(
        ERROR_MESSAGES.TITLE_TOO_LONG(VALIDATION.TITLE_MAX_LENGTH),
        'title'
      )
    }

    // Validate description
    if (!data.description || typeof data.description !== 'string') {
      throw new TicketValidationError(ERROR_MESSAGES.DESCRIPTION_REQUIRED, 'description')
    }

    const trimmedDescription = data.description.trim()
    if (trimmedDescription.length === 0) {
      throw new TicketValidationError(ERROR_MESSAGES.DESCRIPTION_EMPTY, 'description')
    }

    if (trimmedDescription.length > VALIDATION.DESCRIPTION_MAX_LENGTH) {
      throw new TicketValidationError(
        ERROR_MESSAGES.DESCRIPTION_TOO_LONG(VALIDATION.DESCRIPTION_MAX_LENGTH),
        'description'
      )
    }

    // Validate priority
    if (!data.priority) {
      throw new TicketValidationError(ERROR_MESSAGES.PRIORITY_REQUIRED, 'priority')
    }
  }

  updateStatus(status: TicketStatus): void {
    this.status = status
    // Ensure different timestamp by adding 1ms if same
    const newTime = new Date()
    if (newTime.getTime() <= this.updatedAt.getTime()) {
      newTime.setTime(this.updatedAt.getTime() + 1)
    }
    this.updatedAt = newTime
  }

  updatePriority(priority: TicketPriority): void {
    this.priority = priority
    // Ensure different timestamp by adding 1ms if same
    const newTime = new Date()
    if (newTime.getTime() <= this.updatedAt.getTime()) {
      newTime.setTime(this.updatedAt.getTime() + 1)
    }
    this.updatedAt = newTime
  }

  toJSON(): TicketJSON {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      type: this.type,
      privacy: this.privacy,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    }
  }

  static fromJSON(json: TicketJSON): Ticket {
    const ticket = new Ticket(
      {
        title: json.title,
        description: json.description,
        priority: json.priority,
        status: json.status,
        type: json.type,
        privacy: json.privacy,
      },
      json.id
    )

    // Override the dates with validation
    const createdAt = new Date(json.createdAt)
    const updatedAt = new Date(json.updatedAt)

    if (Number.isNaN(createdAt.getTime()) || Number.isNaN(updatedAt.getTime())) {
      throw new TicketValidationError(ERROR_MESSAGES.INVALID_DATE_FORMAT)
    }

    ;(ticket as any).createdAt = createdAt
    ;(ticket as any).updatedAt = updatedAt

    return ticket
  }
}
