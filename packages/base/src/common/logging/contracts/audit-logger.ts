/**
 * Audit Logger interface for tracking all system operations with complete traceability.
 *
 * This interface provides comprehensive audit trail functionality including:
 * - CRUD operation tracking with before/after state
 * - Actor attribution (human, AI, system)
 * - Operation context and traceability
 * - Query and statistics capabilities
 */

import type { LogSource, OperationType } from '../types/log-metadata.ts'
export interface AuditLogger {
  /**
   * Record a CREATE operation in the audit trail.
   * Captures the creation of new entities with full context.
   *
   * @param event - Create operation event with null before state and complete after state
   */
  recordCreate(event: CreateOperationEvent): void

  /**
   * Record an UPDATE operation in the audit trail.
   * Captures modifications to existing entities with before/after comparison.
   *
   * @param event - Update operation event with before/after state and field-level changes
   */
  recordUpdate(event: UpdateOperationEvent): void

  /**
   * Record a DELETE operation in the audit trail.
   * Captures the removal of entities with final state preservation.
   *
   * @param event - Delete operation event with complete before state and null after state
   */
  recordDelete(event: DeleteOperationEvent): void

  /**
   * Query audit events by filter criteria.
   * Enables audit trail analysis and compliance reporting.
   *
   * @param filter - Filter criteria for event selection
   * @returns Array of matching audit events, ordered by timestamp (newest first)
   */
  queryEvents(filter: AuditFilter): Promise<AuditEvent[]>

  /**
   * Get operation statistics for a time period.
   * Provides aggregated metrics for audit analysis and monitoring.
   *
   * @param period - Time period for statistics calculation
   * @returns Aggregated statistics for the specified period
   */
  getStatistics(period: TimePeriod): Promise<AuditStatistics>
}

/**
 * Base interface for all audit events.
 * Contains common fields required for every audit trail entry.
 */
export interface BaseAuditEvent {
  /** Unique identifier for this audit event */
  id: string

  /** Timestamp when the operation occurred */
  timestamp: Date

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

  /** Source system or interface where the operation originated */
  source: LogSource
}

/**
 * Audit event for CREATE operations.
 * Records the creation of new entities with complete initial state.
 */
export interface CreateOperationEvent extends BaseAuditEvent {
  operation: 'create'

  /** No previous state for create operations */
  before: null

  /** Complete initial state of the created entity */
  after: Record<string, unknown>
}

/**
 * Audit event for UPDATE operations.
 * Records modifications to existing entities with detailed change tracking.
 */
export interface UpdateOperationEvent extends BaseAuditEvent {
  operation: 'update'

  /** State of the entity before the update */
  before: Record<string, unknown>

  /** State of the entity after the update */
  after: Record<string, unknown>

  /** Field-level changes for detailed audit trail */
  changes: FieldChange[]
}

/**
 * Audit event for DELETE operations.
 * Records the removal of entities with final state preservation.
 */
export interface DeleteOperationEvent extends BaseAuditEvent {
  operation: 'delete'

  /** Complete final state of the entity before deletion */
  before: Record<string, unknown>

  /** No state after deletion */
  after: null
}

/**
 * Union type representing any audit event.
 */
export type AuditEvent = CreateOperationEvent | UpdateOperationEvent | DeleteOperationEvent

/**
 * Actor information for operation attribution.
 * Supports human, AI, and system actors with appropriate context.
 */
export interface Actor {
  /** Type of actor performing the operation */
  type: 'human' | 'ai' | 'system'

  /** Unique identifier for the actor */
  id: string

  /** Human-readable name of the actor */
  name?: string

  /** Co-author for AI operations (human oversight) */
  coAuthor?: string
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
}

/**
 * Filter criteria for querying audit events.
 */
export interface AuditFilter {
  /** Filter by operation type */
  operation?: OperationType

  /** Filter by entity type */
  entityType?: string

  /** Filter by specific entity */
  entityId?: string

  /** Filter by actor */
  actor?: {
    /** Actor ID */
    id?: string
    /** Actor type */
    type?: 'human' | 'ai' | 'system'
  }

  /** Filter by source system */
  source?: LogSource

  /** Filter by date range */
  dateRange?: {
    /** Start date (inclusive) */
    start: Date
    /** End date (inclusive) */
    end: Date
  }

  /** Filter by trace ID */
  traceId?: string

  /** Limit number of results */
  limit?: number

  /** Offset for pagination */
  offset?: number
}

/**
 * Time period specification for statistics.
 */
export interface TimePeriod {
  /** Start of the period (inclusive) */
  start: Date

  /** End of the period (inclusive) */
  end: Date
}

/**
 * Aggregated audit statistics for a time period.
 */
export interface AuditStatistics {
  /** Time period for these statistics */
  period: TimePeriod

  /** Total number of operations in the period */
  totalOperations: number

  /** Operations broken down by type */
  operationsByType: Record<OperationType, number>

  /** Operations broken down by actor type */
  operationsByActor: Record<'human' | 'ai' | 'system', number>

  /** Operations broken down by entity type */
  operationsByEntity: Record<string, number>

  /** Operations broken down by source */
  operationsBySource: Record<LogSource, number>

  /** Most active actors in the period */
  mostActiveActors: Array<{
    actor: Actor
    operationCount: number
  }>

  /** Most frequently modified entities */
  mostModifiedEntities: Array<{
    entityType: string
    entityId: string
    operationCount: number
  }>
}

/**
 * Re-export operation and source types from the main logging module
 * to maintain consistency across the audit logging system.
 */
export type { LogSource, OperationType } from '../types/log-metadata.ts'
