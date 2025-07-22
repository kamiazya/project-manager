/**
 * Common Logging Foundation - Bounded Context Export
 *
 * Exports all logging-related interfaces, types, and domain models
 * from the base layer following Clean Architecture principles.
 */

export type {
  AuditEvent as OperationAuditEvent,
  AuditFilter,
  AuditLogger,
  AuditStatistics,
  CreateOperationEvent,
  DeleteOperationEvent,
  TimePeriod,
  UpdateOperationEvent,
} from './contracts/audit-logger.ts'
export type { LogConfig } from './contracts/log-config.ts'
// Contracts (Interfaces)
export type { Logger } from './contracts/logger.ts'
export {
  AuditEventModel,
  AuditEventUtils,
  CreateAuditEventModel,
  DeleteAuditEventModel,
  ReadAuditEventModel,
  UpdateAuditEventModel,
} from './models/audit-event.ts'
// Domain Models
export { LogEntryModel, LogEntryUtils } from './models/log-entry.ts'
export type {
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
} from './types/audit-event.ts'
// Types
export type { LogLevel } from './types/log-level.ts'
export type {
  ArchitectureLayer,
  LogContext,
  LogMetadata,
} from './types/log-metadata.ts'
export type { TraceContext } from './types/trace-context.ts'
