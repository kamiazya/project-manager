/**
 * Audit event type definitions for comprehensive operation tracking.
 *
 * Provides type-safe structures for recording all system operations
 * with complete traceability, actor attribution, and state tracking.
 */

import type { OperationType } from './log-metadata.ts'

/**
 * Base interface for all audit events.
 * Contains common fields required for every audit trail entry.
 */
export interface BaseAuditEvent {
  /** Unique identifier for this audit event */
  id: string

  /** Timestamp when the operation occurred (ISO 8601 string for serialization) */
  timestamp: string

  /** Trace identifier for correlating operations across system boundaries */
  traceId: string

  /** Type of operation performed */
  operation: OperationType

  /** Actor who performed the operation */
  actor: Actor

  /** Type of entity that was operated on */
  entityType: string

  /** Unique identifier of the specific entity */
  entityId: string

  /** Optional additional context for the operation */
  context?: AuditEventContext
}

/**
 * Audit event for CREATE operations.
 * Records the creation of new entities with complete initial state.
 */
export interface CreateAuditEvent extends BaseAuditEvent {
  operation: 'create'

  /** No previous state for create operations */
  before: null

  /** Complete initial state of the created entity */
  after: Record<string, unknown>
}

/**
 * Audit event for READ operations.
 * Records data access operations for compliance and monitoring.
 */
export interface ReadAuditEvent extends BaseAuditEvent {
  operation: 'read'

  /** State of the entity that was accessed */
  state: Record<string, unknown>

  /** Access details */
  accessDetails?: {
    /** Fields that were accessed */
    fieldsAccessed?: string[]

    /** Query parameters used */
    queryParams?: Record<string, unknown>

    /** Number of records accessed */
    recordCount?: number

    /** Whether sensitive data was accessed */
    containsSensitiveData?: boolean
  }
}

/**
 * Audit event for UPDATE operations.
 * Records modifications to existing entities with detailed change tracking.
 */
export interface UpdateAuditEvent extends BaseAuditEvent {
  operation: 'update'

  /** State of the entity before the update */
  before: Record<string, unknown>

  /** State of the entity after the update */
  after: Record<string, unknown>

  /** Field-level changes for detailed audit trail */
  changes: FieldChange[]

  /** Update details */
  updateDetails?: {
    /** Reason for the update */
    reason?: string

    /** Whether this was a partial or complete update */
    updateType?: 'partial' | 'complete'

    /** Validation results */
    validationResults?: ValidationResult[]
  }
}

/**
 * Audit event for DELETE operations.
 * Records the removal of entities with final state preservation.
 */
export interface DeleteAuditEvent extends BaseAuditEvent {
  operation: 'delete'

  /** Complete final state of the entity before deletion */
  before: Record<string, unknown>

  /** No state after deletion */
  after: null

  /** Deletion details */
  deletionDetails?: {
    /** Reason for deletion */
    reason?: string

    /** Whether this was a soft delete */
    softDelete?: boolean

    /** Related entities that were also affected */
    cascadeDeleted?: string[]
  }
}

/**
 * Union type representing any audit event.
 */
export type AuditEvent = CreateAuditEvent | ReadAuditEvent | UpdateAuditEvent | DeleteAuditEvent

/**
 * Actor information for operation attribution.
 * Supports human, AI, and system actors with appropriate context.
 */
export interface Actor {
  /** Type of actor performing the operation */
  type: ActorType

  /** Unique identifier for the actor */
  id: string

  /** Human-readable name of the actor */
  name?: string

  /** Co-author for AI operations (human oversight) */
  coAuthor?: string

  /** Additional actor context */
  context?: ActorContext
}

/**
 * Actor type enumeration.
 */
export type ActorType = 'human' | 'ai' | 'system'

/**
 * Additional context for actors.
 */
export interface ActorContext {
  /** Role or permission level */
  role?: string

  /** Department or team */
  department?: string

  /** IP address (for human actors) */
  ipAddress?: string

  /** User agent (for web-based operations) */
  userAgent?: string

  /** Session information */
  session?: {
    id: string
    startTime: string
    duration?: number
  }

  /** AI-specific context */
  aiContext?: {
    /** Model or version used */
    model?: string

    /** Confidence level in the operation */
    confidence?: number

    /** Training data cutoff date */
    trainingCutoff?: string
  }

  /** System-specific context */
  systemContext?: {
    /** Service or process name */
    service?: string

    /** Version of the system */
    version?: string

    /** Host or container identifier */
    host?: string
  }
}

/**
 * Field-level change information for detailed audit trails.
 */
export interface FieldChange {
  /** Name of the field that changed */
  field: string

  /** Previous value of the field */
  oldValue: unknown

  /** New value of the field */
  newValue: unknown

  /** Type of change */
  changeType?: FieldChangeType

  /** Additional change context */
  context?: {
    /** Reason for the change */
    reason?: string

    /** Validation applied to the change */
    validation?: string

    /** Whether the change was automatically applied */
    automatic?: boolean
  }
}

/**
 * Type of field change for categorization.
 */
export type FieldChangeType = 'added' | 'modified' | 'removed' | 'reordered'

/**
 * Validation result for audit trail.
 */
export interface ValidationResult {
  /** Field that was validated */
  field: string

  /** Whether validation passed */
  passed: boolean

  /** Validation rule that was applied */
  rule: string

  /** Error message if validation failed */
  error?: string
}

/**
 * Additional context for audit events.
 */
export interface AuditEventContext {
  /** Business justification for the operation */
  businessJustification?: string

  /** Request that triggered this operation */
  triggeringRequest?: {
    id: string
    type: string
    source: string
  }

  /** Workflow or process this operation is part of */
  workflow?: {
    id: string
    name: string
    step: string
  }

  /** Approval or authorization details */
  authorization?: {
    /** Who authorized this operation */
    authorizedBy?: string

    /** Authorization timestamp */
    authorizedAt?: string

    /** Authorization method */
    method?: string

    /** Permission level required */
    permissionLevel?: string
  }

  /** Risk assessment for this operation */
  risk?: {
    /** Risk level assessed */
    level: 'low' | 'medium' | 'high' | 'critical'

    /** Risk factors identified */
    factors?: string[]

    /** Mitigation measures applied */
    mitigation?: string[]
  }

  /** Compliance-related information */
  compliance?: {
    /** Regulations this operation must comply with */
    regulations?: string[]

    /** Retention requirements */
    retention?: {
      period: string
      reason: string
    }
  }
}

/**
 * Filter criteria for querying audit events.
 */
export interface AuditEventFilter {
  /** Filter by operation type */
  operation?: OperationType | OperationType[]

  /** Filter by entity type */
  entityType?: string | string[]

  /** Filter by specific entity */
  entityId?: string | string[]

  /** Filter by actor */
  actor?: {
    /** Actor ID */
    id?: string | string[]
    /** Actor type */
    type?: ActorType | ActorType[]
    /** Actor name (partial match) */
    name?: string
  }

  /** Filter by date range */
  dateRange?: {
    /** Start date (inclusive) */
    start: string
    /** End date (inclusive) */
    end: string
  }

  /** Filter by trace ID */
  traceId?: string | string[]

  /** Filter by compliance requirements */
  compliance?: {
    /** Regulation filter */
    regulations?: string[]
  }

  /** Full-text search in event details */
  searchText?: string

  /** Limit number of results */
  limit?: number

  /** Offset for pagination */
  offset?: number

  /** Sort order */
  sort?: {
    field: 'timestamp' | 'operation' | 'entityType' | 'actor.id'
    direction: 'asc' | 'desc'
  }
}

/**
 * Audit event statistics for monitoring and compliance reporting.
 */
export interface AuditEventStatistics {
  /** Time period for these statistics */
  period: {
    start: string
    end: string
  }

  /** Total number of operations in the period */
  totalOperations: number

  /** Operations broken down by type */
  operationsByType: Record<OperationType, number>

  /** Operations broken down by actor type */
  operationsByActor: Record<ActorType, number>

  /** Operations broken down by entity type */
  operationsByEntity: Record<string, number>

  /** Operations broken down by risk level */
  operationsByRisk: Record<'low' | 'medium' | 'high' | 'critical', number>

  /** Most active actors in the period */
  mostActiveActors: Array<{
    actor: Pick<Actor, 'id' | 'name' | 'type'>
    operationCount: number
    lastActivity: string
  }>

  /** Most frequently modified entities */
  mostModifiedEntities: Array<{
    entityType: string
    entityId: string
    operationCount: number
    lastModified: string
  }>

  /** Compliance summary */
  compliance: {
    /** Total sensitive data operations */
    sensitiveDataOperations: number

    /** Operations by data classification */
    byDataClassification: Record<string, number>
  }

  /** Error and anomaly detection */
  anomalies?: {
    /** Unusual activity patterns detected */
    patterns: Array<{
      type: string
      description: string
      severity: 'low' | 'medium' | 'high'
      count: number
    }>

    /** Failed operations */
    failures: number

    /** Operations outside business hours */
    outsideBusinessHours: number
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
      sanitized.before = this.sanitizeState(sanitized.before)
    }
    if ('after' in sanitized && sanitized.after) {
      sanitized.after = this.sanitizeState(sanitized.after)
    }

    // Sanitize state for read operations
    if ('state' in sanitized && sanitized.state) {
      sanitized.state = this.sanitizeState(sanitized.state)
    }

    // Sanitize field changes
    if ('changes' in sanitized && sanitized.changes) {
      sanitized.changes = sanitized.changes.map(change => ({
        ...change,
        oldValue: this.sanitizeValue(change.oldValue),
        newValue: this.sanitizeValue(change.newValue),
      }))
    }

    return sanitized
  },

  /**
   * Sanitize state object by redacting sensitive fields.
   */
  sanitizeState(state: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {}
    const sensitiveFields = [
      'password',
      'token',
      'apiKey',
      'secret',
      'credential',
      'ssn',
      'creditCard',
    ]

    for (const [key, value] of Object.entries(state)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '***REDACTED***'
      } else if (value && typeof value === 'object') {
        sanitized[key] = this.sanitizeState(value as Record<string, unknown>)
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
        (value.length > 32 && /^[A-Za-z0-9+/=]+$/.test(value))
      ) {
        return '***REDACTED***'
      }
    }

    if (value && typeof value === 'object') {
      return this.sanitizeState(value as Record<string, unknown>)
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
} as const
