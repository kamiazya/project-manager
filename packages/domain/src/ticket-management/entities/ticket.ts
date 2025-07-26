import { ValidationError } from '@project-manager/base'
import type { AliasType, TicketAliasCollection } from '../types/alias-types.ts'
import type { TicketPriorityKey, TicketStatusKey, TicketTypeKey } from '../types/ticket-types.ts'
import {
  createTicketPriority,
  createTicketStatus,
  createTicketType,
} from '../types/ticket-types.ts'
import { TicketAlias } from '../value-objects/ticket-alias.ts'
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
  aliases?: TicketAliasCollection
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
  aliases?: {
    canonical?: { value: string; type: AliasType }
    custom: Array<{ value: string; type: AliasType }>
  }
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
   *
   * @param id - Pre-generated ticket ID (to maintain Clean Architecture)
   * @param data - Ticket creation data
   * @returns New Ticket instance
   */
  public static create(id: TicketId, data: CreateTicketData): Ticket {
    const now = new Date()

    return new Ticket({
      id,
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
    // Reconstitute aliases if present
    let aliases: TicketAliasCollection | undefined
    if (data.aliases) {
      aliases = {
        canonical: data.aliases.canonical
          ? TicketAlias.fromValue(data.aliases.canonical.value, data.aliases.canonical.type)
          : undefined,
        custom: data.aliases.custom.map(a => TicketAlias.fromValue(a.value, a.type)),
      }
    }

    return new Ticket({
      id: TicketId.fromValue(data.id),
      title: TicketTitle.create(data.title),
      description: data.description ? TicketDescription.create(data.description) : undefined,
      status: createTicketStatus(data.status),
      priority: createTicketPriority(data.priority),
      type: createTicketType(data.type),
      aliases,
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

  get aliases(): TicketAliasCollection {
    return this.props.aliases || { custom: [] }
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

  /**
   * Business operation: Set canonical alias (system-generated)
   * This should only be called once when the ticket is first accessed
   */
  public setCanonicalAlias(alias: TicketAlias): void {
    if (!alias.isCanonical()) {
      throw new ValidationError(
        'Only canonical aliases can be set as canonical alias',
        'alias.type',
        alias.type
      )
    }

    if (this.hasCanonicalAlias()) {
      throw new ValidationError(
        'Canonical alias already exists and cannot be changed',
        'canonicalAlias',
        this.props.aliases?.canonical?.value
      )
    }

    this.ensureAliasesInitialized()
    this.props.aliases!.canonical = alias
    this.updateTimestamp()
  }

  /**
   * Business operation: Replace canonical alias (for promotion operations)
   * This allows replacing an existing canonical alias with a new one
   */
  public replaceCanonicalAlias(alias: TicketAlias): void {
    if (!alias.isCanonical()) {
      throw new ValidationError(
        'Only canonical aliases can be set as canonical alias',
        'alias.type',
        alias.type
      )
    }

    this.ensureAliasesInitialized()
    this.props.aliases!.canonical = alias
    this.updateTimestamp()
  }

  /**
   * Business operation: Add custom alias (user-defined)
   */
  public addCustomAlias(alias: TicketAlias): void {
    if (!alias.isCustom()) {
      throw new ValidationError(
        'Only custom aliases can be added as custom alias',
        'alias.type',
        alias.type
      )
    }

    this.ensureAliasesInitialized()

    // Check for duplicates
    const existingAlias = this.props.aliases!.custom.find(a => a.equals(alias))
    if (existingAlias) {
      throw new ValidationError(
        `Custom alias '${alias.value}' already exists for this ticket`,
        'customAlias',
        alias.value
      )
    }

    this.props.aliases!.custom.push(alias)
    this.updateTimestamp()
  }

  /**
   * Business operation: Remove custom alias
   */
  public removeCustomAlias(aliasValue: string): void {
    if (!this.props.aliases?.custom) {
      return // No custom aliases to remove
    }

    const index = this.props.aliases.custom.findIndex(a => a.matches(aliasValue))
    if (index === -1) {
      throw new ValidationError(`Custom alias '${aliasValue}' not found`, 'aliasValue', aliasValue)
    }

    this.props.aliases.custom.splice(index, 1)
    this.updateTimestamp()
  }

  /**
   * Business operation: Clear all custom aliases
   * @returns {string[]} The list of cleared alias values
   */
  public clearCustomAliases(): string[] {
    if (!this.props.aliases?.custom || this.props.aliases.custom.length === 0) {
      return []
    }
    const clearedAliases = this.props.aliases.custom.map(a => a.value)
    this.props.aliases.custom = []
    this.updateTimestamp()
    return clearedAliases
  }

  /**
   * Check if this ticket has a canonical alias
   */
  public hasCanonicalAlias(): boolean {
    return this.props.aliases?.canonical !== undefined
  }

  /**
   * Check if this ticket has any custom aliases
   */
  public hasCustomAliases(): boolean {
    return (this.props.aliases?.custom?.length || 0) > 0
  }

  /**
   * Get all aliases (canonical + custom) as strings
   */
  public getAllAliases(): string[] {
    const aliases: string[] = []

    if (this.props.aliases?.canonical) {
      aliases.push(this.props.aliases.canonical.value)
    }

    if (this.props.aliases?.custom) {
      aliases.push(...this.props.aliases.custom.map(a => a.value))
    }

    return aliases
  }

  /**
   * Check if this ticket can be referenced by the given alias
   */
  public matchesAlias(aliasValue: string): boolean {
    if (this.props.aliases?.canonical?.matches(aliasValue)) {
      return true
    }

    return this.props.aliases?.custom?.some(a => a.matches(aliasValue)) || false
  }

  /**
   * Get the primary display alias (canonical if available, otherwise first custom)
   */
  public getPrimaryAlias(): string | undefined {
    if (this.props.aliases?.canonical) {
      return this.props.aliases.canonical.value
    }

    const customAliases = this.props.aliases?.custom
    if (customAliases && customAliases.length > 0) {
      return customAliases[0]?.value
    }

    return undefined
  }

  private ensureAliasesInitialized(): void {
    if (!this.props.aliases) {
      this.props.aliases = { custom: [] }
    }
  }

  private updateTimestamp(): void {
    const now = new Date()
    const minTimestamp = new Date(this.props.updatedAt.getTime() + 1)
    this.props.updatedAt = now > minTimestamp ? now : minTimestamp
  }
}
