/**
 * Audit Event domain model for comprehensive operation tracking.
 *
 * This model represents audit events with complete traceability,
 * actor attribution, and state tracking for compliance and monitoring.
 */

import { ValidationError } from '../../errors/base-errors.ts'
import type {
  Actor,
  ActorType,
  AuditEvent,
  AuditEventContext,
  AuditEventFilter,
  AuditEventStatistics,
  BaseAuditEvent,
  CreateAuditEvent,
  DeleteAuditEvent,
  FieldChange,
  FieldChangeType,
  ReadAuditEvent,
  UpdateAuditEvent,
  ValidationResult,
} from '../types/audit-event.ts'
import type { LogSource, OperationType } from '../types/log-metadata.ts'

/**
 * Access details for READ operations.
 * Tracks what was accessed and how for compliance and monitoring.
 */
export interface AccessDetails {
  /** Fields that were accessed */
  fieldsAccessed?: string[]

  /** Query parameters used */
  queryParams?: Record<string, unknown>

  /** Number of records accessed */
  recordCount?: number

  /** Whether sensitive data was accessed */
  containsSensitiveData?: boolean
}

/**
 * Update details for UPDATE operations.
 * Provides context about the nature and reason for updates.
 */
export interface UpdateDetails {
  /** Reason for the update */
  reason?: string

  /** Whether this was a partial or complete update */
  updateType?: 'partial' | 'complete'

  /** Validation results */
  validationResults?: ValidationResult[]
}

/**
 * Deletion details for DELETE operations.
 * Tracks deletion context and cascading effects.
 */
export interface DeletionDetails {
  /** Reason for deletion */
  reason?: string

  /** Whether this was a soft delete */
  softDelete?: boolean

  /** Related entities that were also affected */
  cascadeDeleted?: string[]
}

/**
 * Parameters for creating audit events.
 */
export interface CreateAuditEventParams {
  /** Operation type */
  operation: OperationType

  /** Actor performing the operation */
  actor: Actor

  /** Entity type */
  entityType: string

  /** Entity identifier */
  entityId: string

  /** Source system */
  source: LogSource

  /** Previous state */
  before?: Record<string, unknown> | null

  /** New state */
  after?: Record<string, unknown> | null

  /** State for read operations */
  state?: Record<string, unknown>

  /** Optional custom timestamp (defaults to current time) */
  timestamp?: Date

  /** Optional custom ID (auto-generated if not provided) */
  id?: string

  /** Optional trace ID (auto-generated if not provided) */
  traceId?: string

  /** Optional context */
  context?: AuditEventContext

  /** Optional field changes (auto-calculated for updates if not provided) */
  changes?: FieldChange[]

  /** Optional access details (for read operations) */
  accessDetails?: AccessDetails

  /** Optional update details (for update operations) */
  updateDetails?: UpdateDetails

  /** Optional deletion details (for delete operations) */
  deletionDetails?: DeletionDetails
}

/**
 * Audit event domain model with business logic.
 */
export class AuditEventModel implements BaseAuditEvent {
  readonly id: string
  readonly timestamp: string
  readonly traceId: string
  readonly operation: OperationType
  readonly actor: Actor
  readonly entityType: string
  readonly entityId: string
  readonly source: LogSource
  readonly context?: AuditEventContext

  constructor(params: CreateAuditEventParams) {
    this.id = params.id || AuditEventModel.generateId()
    this.timestamp = params.timestamp ? params.timestamp.toISOString() : new Date().toISOString()
    this.traceId = params.traceId || AuditEventModel.generateTraceId()
    this.operation = params.operation
    this.actor = params.actor
    this.entityType = params.entityType
    this.entityId = params.entityId
    this.source = params.source
    this.context = params.context

    // Validate required fields
    this.validate()
  }

  /**
   * Create a new audit event from parameters.
   */
  static create(params: CreateAuditEventParams): AuditEventModel {
    return new AuditEventModel(params)
  }

  /**
   * Create a CREATE audit event.
   */
  static createCreate(
    actor: Actor,
    entityType: string,
    entityId: string,
    after: Record<string, unknown>,
    source: LogSource,
    options: Partial<CreateAuditEventParams> = {}
  ): CreateAuditEventModel {
    return new CreateAuditEventModel({
      ...options,
      operation: 'create',
      actor,
      entityType,
      entityId,
      source,
      before: null,
      after,
    })
  }

  /**
   * Create a READ audit event.
   */
  static createRead(
    actor: Actor,
    entityType: string,
    entityId: string,
    state: Record<string, unknown>,
    source: LogSource,
    accessDetails?: AccessDetails,
    options: Partial<CreateAuditEventParams> = {}
  ): ReadAuditEventModel {
    return new ReadAuditEventModel({
      ...options,
      operation: 'read',
      actor,
      entityType,
      entityId,
      source,
      state,
      accessDetails,
    })
  }

  /**
   * Create an UPDATE audit event.
   */
  static createUpdate(
    actor: Actor,
    entityType: string,
    entityId: string,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
    source: LogSource,
    options: Partial<CreateAuditEventParams> = {}
  ): UpdateAuditEventModel {
    const changes = options.changes || AuditEventUtils.calculateChanges(before, after)

    return new UpdateAuditEventModel({
      ...options,
      operation: 'update',
      actor,
      entityType,
      entityId,
      source,
      before,
      after,
      changes,
    })
  }

  /**
   * Create a DELETE audit event.
   */
  static createDelete(
    actor: Actor,
    entityType: string,
    entityId: string,
    before: Record<string, unknown>,
    source: LogSource,
    deletionDetails?: DeletionDetails,
    options: Partial<CreateAuditEventParams> = {}
  ): DeleteAuditEventModel {
    return new DeleteAuditEventModel({
      ...options,
      operation: 'delete',
      actor,
      entityType,
      entityId,
      source,
      before,
      after: null,
      deletionDetails,
    })
  }

  /**
   * Create an audit event from a plain object.
   */
  static fromObject(obj: Partial<AuditEvent>): AuditEventModel {
    const params: CreateAuditEventParams = {
      id: obj.id,
      timestamp: obj.timestamp ? new Date(obj.timestamp) : undefined,
      traceId: obj.traceId,
      operation: obj.operation || 'read',
      actor: obj.actor || { type: 'system', id: 'unknown' },
      entityType: obj.entityType || '',
      entityId: obj.entityId || '',
      source: obj.source || 'system',
      before: 'before' in obj ? obj.before : undefined,
      after: 'after' in obj ? obj.after : undefined,
      context: obj.context,
    }

    // Add state for read operations
    if ('state' in obj && obj.state) {
      params.state = obj.state
    }

    // Add operation-specific details
    if ('changes' in obj && obj.changes) {
      params.changes = obj.changes
    }
    if ('accessDetails' in obj && obj.accessDetails) {
      params.accessDetails = obj.accessDetails
    }
    if ('updateDetails' in obj && obj.updateDetails) {
      params.updateDetails = obj.updateDetails
    }
    if ('deletionDetails' in obj && obj.deletionDetails) {
      params.deletionDetails = obj.deletionDetails
    }

    return new AuditEventModel(params)
  }

  /**
   * Generate a unique audit event ID.
   */
  static generateId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `audit-${timestamp}-${random}`
  }

  /**
   * Generate a trace ID for audit correlation.
   */
  static generateTraceId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `trace-${timestamp}-${random}`
  }

  /**
   * Validate audit event data.
   */
  private validate(): void {
    const errors = AuditEventUtils.validate(this.toObject() as AuditEvent)
    if (errors.length > 0) {
      throw new ValidationError(
        `Audit event validation failed: ${errors.join(', ')}`,
        'audit-event',
        'validation'
      )
    }
  }

  /**
   * Convert to plain object.
   */
  toObject(): BaseAuditEvent {
    return {
      id: this.id,
      timestamp: this.timestamp,
      traceId: this.traceId,
      operation: this.operation,
      actor: this.actor,
      entityType: this.entityType,
      entityId: this.entityId,
      source: this.source,
      context: this.context,
    }
  }

  /**
   * Serialize to JSON string.
   */
  serialize(sanitize = true): string {
    const obj = this.toObject()
    const toSerialize = sanitize ? AuditEventUtils.sanitize(obj as AuditEvent) : obj
    return JSON.stringify(toSerialize)
  }

  /**
   * Clone the audit event with optional modifications.
   */
  clone(modifications: Partial<CreateAuditEventParams> = {}): AuditEventModel {
    return new AuditEventModel({
      id: modifications.id || this.id,
      timestamp: modifications.timestamp || new Date(this.timestamp),
      traceId: modifications.traceId || this.traceId,
      operation: modifications.operation || this.operation,
      actor: modifications.actor || this.actor,
      entityType: modifications.entityType || this.entityType,
      entityId: modifications.entityId || this.entityId,
      source: modifications.source || this.source,
      context: modifications.context || this.context,
    })
  }

  /**
   * Check if this audit event matches a filter.
   */
  matches(filter: AuditEventFilter): boolean {
    // Check operation
    if (filter.operation) {
      const operations = Array.isArray(filter.operation) ? filter.operation : [filter.operation]
      if (!operations.includes(this.operation)) {
        return false
      }
    }

    // Check entity type
    if (filter.entityType) {
      const entityTypes = Array.isArray(filter.entityType) ? filter.entityType : [filter.entityType]
      if (!entityTypes.includes(this.entityType)) {
        return false
      }
    }

    // Check entity ID
    if (filter.entityId) {
      const entityIds = Array.isArray(filter.entityId) ? filter.entityId : [filter.entityId]
      if (!entityIds.includes(this.entityId)) {
        return false
      }
    }

    // Check actor
    if (filter.actor) {
      if (filter.actor.id) {
        const actorIds = Array.isArray(filter.actor.id) ? filter.actor.id : [filter.actor.id]
        if (!actorIds.includes(this.actor.id)) {
          return false
        }
      }

      if (filter.actor.type) {
        const actorTypes = Array.isArray(filter.actor.type)
          ? filter.actor.type
          : [filter.actor.type]
        if (!actorTypes.includes(this.actor.type)) {
          return false
        }
      }

      if (filter.actor.name && this.actor.name) {
        if (!this.actor.name.toLowerCase().includes(filter.actor.name.toLowerCase())) {
          return false
        }
      }
    }

    // Check source
    if (filter.source) {
      const sources = Array.isArray(filter.source) ? filter.source : [filter.source]
      if (!sources.includes(this.source)) {
        return false
      }
    }

    // Check date range
    if (filter.dateRange) {
      const timestamp = new Date(this.timestamp).getTime()

      if (filter.dateRange.start) {
        const startTime = new Date(filter.dateRange.start).getTime()
        if (timestamp < startTime) {
          return false
        }
      }

      if (filter.dateRange.end) {
        const endTime = new Date(filter.dateRange.end).getTime()
        if (timestamp > endTime) {
          return false
        }
      }
    }

    // Check trace ID
    if (filter.traceId) {
      const traceIds = Array.isArray(filter.traceId) ? filter.traceId : [filter.traceId]
      if (!traceIds.includes(this.traceId)) {
        return false
      }
    }

    return true
  }
}

/**
 * CREATE audit event implementation.
 */
export class CreateAuditEventModel extends AuditEventModel implements CreateAuditEvent {
  readonly operation = 'create' as const
  readonly before = null
  readonly after: Record<string, unknown>

  constructor(params: CreateAuditEventParams) {
    super(params)

    if (params.operation !== 'create') {
      throw new ValidationError(
        'CreateAuditEventModel requires operation to be "create"',
        'operation',
        params.operation
      )
    }

    if (!params.after) {
      throw new ValidationError('CreateAuditEventModel requires after state', 'after', undefined)
    }

    this.after = params.after
  }

  toObject(): CreateAuditEvent {
    return {
      ...super.toObject(),
      operation: this.operation,
      before: this.before,
      after: this.after,
    }
  }
}

/**
 * READ audit event implementation.
 */
export class ReadAuditEventModel extends AuditEventModel implements ReadAuditEvent {
  readonly operation = 'read' as const
  readonly state: Record<string, unknown>
  readonly accessDetails?: AccessDetails

  constructor(params: CreateAuditEventParams & { accessDetails?: AccessDetails }) {
    super(params)

    if (params.operation !== 'read') {
      throw new ValidationError(
        'ReadAuditEventModel requires operation to be "read"',
        'operation',
        params.operation
      )
    }

    if (!params.state) {
      throw new ValidationError('ReadAuditEventModel requires state parameter', 'state', undefined)
    }

    this.state = params.state
    this.accessDetails = params.accessDetails
  }

  toObject(): ReadAuditEvent {
    return {
      ...super.toObject(),
      operation: this.operation,
      state: this.state,
      accessDetails: this.accessDetails,
    }
  }
}

/**
 * UPDATE audit event implementation.
 */
export class UpdateAuditEventModel extends AuditEventModel implements UpdateAuditEvent {
  readonly operation = 'update' as const
  readonly before: Record<string, unknown>
  readonly after: Record<string, unknown>
  readonly changes: FieldChange[]
  readonly updateDetails?: UpdateDetails

  constructor(params: CreateAuditEventParams & { updateDetails?: UpdateDetails }) {
    super(params)

    if (params.operation !== 'update') {
      throw new ValidationError(
        'UpdateAuditEventModel requires operation to be "update"',
        'operation',
        params.operation
      )
    }

    if (!params.before || !params.after) {
      throw new ValidationError(
        'UpdateAuditEventModel requires both before and after states',
        'before/after',
        undefined
      )
    }

    this.before = params.before
    this.after = params.after
    this.changes = params.changes || AuditEventUtils.calculateChanges(params.before, params.after)
    this.updateDetails = params.updateDetails
  }

  toObject(): UpdateAuditEvent {
    return {
      ...super.toObject(),
      operation: this.operation,
      before: this.before,
      after: this.after,
      changes: this.changes,
      updateDetails: this.updateDetails,
    }
  }
}

/**
 * DELETE audit event implementation.
 */
export class DeleteAuditEventModel extends AuditEventModel implements DeleteAuditEvent {
  readonly operation = 'delete' as const
  readonly before: Record<string, unknown>
  readonly after = null
  readonly deletionDetails?: DeletionDetails

  constructor(params: CreateAuditEventParams & { deletionDetails?: DeletionDetails }) {
    super(params)

    if (params.operation !== 'delete') {
      throw new ValidationError(
        'DeleteAuditEventModel requires operation to be "delete"',
        'operation',
        params.operation
      )
    }

    if (!params.before) {
      throw new ValidationError('DeleteAuditEventModel requires before state', 'before', undefined)
    }

    this.before = params.before
    this.deletionDetails = params.deletionDetails
  }

  toObject(): DeleteAuditEvent {
    return {
      ...super.toObject(),
      operation: this.operation,
      before: this.before,
      after: this.after,
      deletionDetails: this.deletionDetails,
    }
  }
}

/**
 * Utility functions for working with audit events.
 */
export const AuditEventUtils = {
  /**
   * Create a standardized audit event ID.
   */
  generateEventId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `audit-${timestamp}-${random}`
  },

  /**
   * Validate audit event structure.
   */
  validate(event: Partial<AuditEvent>): string[] {
    const errors: string[] = []

    if (!event.id) errors.push('Event ID is required')
    if (!event.timestamp) errors.push('Timestamp is required')
    if (!event.traceId) errors.push('Trace ID is required')
    if (!event.operation) errors.push('Operation is required')
    if (!event.actor) errors.push('Actor is required')
    if (!event.entityType) errors.push('Entity type is required')
    if (!event.entityId) errors.push('Entity ID is required')
    if (!event.source) errors.push('Source is required')

    if (event.actor) {
      if (!event.actor.id) errors.push('Actor ID is required')
      if (!event.actor.type) errors.push('Actor type is required')
      if (event.actor.type === 'ai' && !event.actor.coAuthor) {
        errors.push('Co-author is required for AI operations')
      }
    }

    return errors
  },

  /**
   * Sanitize audit event by removing sensitive data.
   */
  sanitize(event: AuditEvent): AuditEvent {
    const sanitized = { ...event }

    // Sanitize before/after states for create, update, delete operations
    if ('before' in sanitized && sanitized.before) {
      sanitized.before = AuditEventUtils.sanitizeState(sanitized.before)
    }
    if ('after' in sanitized && sanitized.after) {
      sanitized.after = AuditEventUtils.sanitizeState(sanitized.after)
    }

    // Sanitize state for read operations
    if ('state' in sanitized && sanitized.state) {
      sanitized.state = AuditEventUtils.sanitizeState(sanitized.state)
    }

    // Sanitize field changes
    if ('changes' in sanitized && sanitized.changes) {
      sanitized.changes = sanitized.changes.map(change => ({
        ...change,
        oldValue: AuditEventUtils.sanitizeValue(change.oldValue),
        newValue: AuditEventUtils.sanitizeValue(change.newValue),
      }))
    }

    return sanitized
  },

  /**
   * Sanitize state object by redacting sensitive fields.
   */
  sanitizeState(state: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {}
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'ssn', 'creditCard']

    for (const [key, value] of Object.entries(state)) {
      // Check for exact sensitive field names (not containing like "credentials")
      if (sensitiveFields.some(field => key.toLowerCase() === field.toLowerCase())) {
        sanitized[key] = '***REDACTED***'
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively sanitize nested objects
        sanitized[key] = AuditEventUtils.sanitizeState(value as Record<string, unknown>)
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  },

  /**
   * Sanitize individual values.
   */
  sanitizeValue(value: unknown): unknown {
    if (typeof value === 'string') {
      // Check if it looks like sensitive data
      if (
        value.toLowerCase().includes('password') ||
        value.toLowerCase().includes('token') ||
        value.toLowerCase().includes('secret') ||
        (value.length > 32 && /^[A-Za-z0-9+/=]+$/.test(value))
      ) {
        return '***REDACTED***'
      }
    }

    if (value && typeof value === 'object') {
      return AuditEventUtils.sanitizeState(value as Record<string, unknown>)
    }

    return value
  },

  /**
   * Calculate field changes between two states.
   */
  calculateChanges(before: Record<string, unknown>, after: Record<string, unknown>): FieldChange[] {
    const changes: FieldChange[] = []
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])

    for (const key of allKeys) {
      const oldValue = before[key]
      const newValue = after[key]

      if (oldValue !== newValue) {
        let changeType: FieldChangeType

        if (oldValue === undefined) {
          changeType = 'added'
        } else if (newValue === undefined) {
          changeType = 'removed'
        } else {
          changeType = 'modified'
        }

        changes.push({
          field: key,
          oldValue,
          newValue,
          changeType,
        })
      }
    }

    return changes
  },

  /**
   * Parse audit event from JSON string.
   */
  parseFromJson(json: string): AuditEventModel {
    try {
      const parsed = JSON.parse(json)
      return AuditEventModel.fromObject({
        ...parsed,
        timestamp: parsed.timestamp, // Keep as ISO string
      })
    } catch (error) {
      throw new ValidationError(`Failed to parse audit event from JSON: ${error}`, 'json', json)
    }
  },

  /**
   * Batch create multiple audit events.
   */
  createBatch(events: CreateAuditEventParams[]): AuditEventModel[] {
    return events.map(params => AuditEventModel.create(params))
  },

  /**
   * Sort audit events by timestamp.
   */
  sortByTimestamp(events: AuditEventModel[], ascending = false): AuditEventModel[] {
    return events.sort((a, b) => {
      const diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      return ascending ? diff : -diff
    })
  },

  /**
   * Group audit events by a field.
   */
  groupBy(
    events: AuditEventModel[],
    field: keyof BaseAuditEvent | string
  ): Record<string, AuditEventModel[]> {
    const groups: Record<string, AuditEventModel[]> = {}

    for (const event of events) {
      let value: string

      if (field in event) {
        const fieldValue = (event as any)[field]
        value = typeof fieldValue === 'object' ? JSON.stringify(fieldValue) : String(fieldValue)
      } else if (event.context && field in event.context) {
        const contextValue = (event.context as Record<string, unknown>)[field]
        value = String(contextValue)
      } else {
        value = 'unknown'
      }

      if (!groups[value]) {
        groups[value] = []
      }
      groups[value]!.push(event)
    }

    return groups
  },

  /**
   * Calculate basic statistics for a collection of audit events.
   */
  calculateStatistics(
    events: AuditEventModel[],
    period: { start: string; end: string }
  ): Partial<AuditEventStatistics> {
    const stats: Partial<AuditEventStatistics> = {
      period,
      totalOperations: events.length,
      operationsByType: {} as Record<OperationType, number>,
      operationsByActor: {} as Record<ActorType, number>,
      operationsByEntity: {} as Record<string, number>,
      operationsBySource: {} as Record<LogSource, number>,
    }

    // Count operations by type
    for (const event of events) {
      // Operation type
      if (!stats.operationsByType![event.operation]) {
        stats.operationsByType![event.operation] = 0
      }
      stats.operationsByType![event.operation]++

      // Actor type
      if (!stats.operationsByActor![event.actor.type]) {
        stats.operationsByActor![event.actor.type] = 0
      }
      stats.operationsByActor![event.actor.type]++

      // Entity type
      if (!stats.operationsByEntity![event.entityType]) {
        stats.operationsByEntity![event.entityType] = 0
      }
      stats.operationsByEntity![event.entityType]!++

      // Source
      if (!stats.operationsBySource![event.source]) {
        stats.operationsBySource![event.source] = 0
      }
      stats.operationsBySource![event.source]++
    }

    return stats
  },
} as const
