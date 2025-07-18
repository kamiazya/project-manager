/**
 * @project-manager/domain
 *
 * Domain layer package containing business logic and domain entities
 * for the Project Manager system.
 */

// Re-export all public APIs - Direct imports (no index.ts files)

export * from './shared/patterns/base-value-object.ts'
// Shared Domain Patterns
export * from './shared/patterns/domain-event.ts'
// Ticket Management Context - Configuration
export {
  TicketDefaultsAdapter,
  type TicketDomainDefaults,
} from './ticket-management/configuration/ticket-defaults-adapter.ts'
// Ticket Management Context - Entities
export {
  type CreateTicketData,
  type ReconstituteTicketData,
  Ticket,
  type TicketProps,
} from './ticket-management/entities/ticket.ts'
// Ticket Management Context - Types and validation
export type {
  TicketPriority,
  TicketPrivacy,
  TicketStatus,
  TicketType,
} from './ticket-management/types/ticket-types.ts'
export {
  isValidTicketPriority,
  isValidTicketPrivacy,
  isValidTicketStatus,
  isValidTicketType,
  TICKET_DEFAULTS,
  TicketValidationError,
} from './ticket-management/types/ticket-types.ts'
export { TicketDescription } from './ticket-management/value-objects/ticket-description.ts'
// Ticket Management Context - Value Objects (classes)
export { TicketId } from './ticket-management/value-objects/ticket-id.ts'
export { TicketPriority as TicketPriorityVO } from './ticket-management/value-objects/ticket-priority.ts'
export { TicketStatus as TicketStatusVO } from './ticket-management/value-objects/ticket-status.ts'
export { TicketTitle } from './ticket-management/value-objects/ticket-title.ts'
