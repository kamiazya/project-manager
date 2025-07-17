/**
 * Infrastructure Layer
 *
 * Contains concrete implementations of repository interfaces,
 * external service adapters, and persistence mechanisms.
 * This layer depends on Application and Domain layers.
 */

// Re-export application interfaces that infrastructure implements
export type {
  TicketRepository,
  TicketStatistics,
} from '@project-manager/application'
// Re-export domain types that infrastructure needs
export type {
  Ticket,
  TicketId,
  TicketPriority,
  TicketPrivacy,
  TicketStatus,
  TicketType,
} from '@project-manager/domain'
// Infrastructure implementations
export * from './infrastructure/adapters/json-ticket-repository.ts'
export * from './infrastructure/adapters/mappers/ticket-mapper.ts'
export * from './infrastructure/config/infrastructure-config.ts'
export * from './infrastructure/container/inversify.config.ts'
export * from './infrastructure/container/types.ts'
export * from './infrastructure/errors/infrastructure-errors.ts'
export * from './infrastructure/types/persistence-types.ts'
