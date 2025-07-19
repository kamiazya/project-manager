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
// Ticket Management Context - Entities
export * from './ticket-management/entities/ticket.ts'

// Ticket Management Context - Types and validation
export * from './ticket-management/types/errors.ts'
export * from './ticket-management/types/ticket-types.ts'
export {
  createTicketPriority,
  createTicketStatus,
  createTicketType,
} from './ticket-management/types/ticket-types.ts'

// Ticket Management Context - Value Objects (classes)
export * from './ticket-management/value-objects/ticket-description.ts'
export * from './ticket-management/value-objects/ticket-id.ts'
export * from './ticket-management/value-objects/ticket-title.ts'
