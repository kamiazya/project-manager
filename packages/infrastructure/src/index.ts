/**
 * Infrastructure Layer
 *
 * Contains concrete implementations of repository interfaces,
 * external service adapters, and persistence mechanisms.
 * This layer depends on Application and Domain layers.
 */

// Re-export application interfaces that infrastructure implements
export type {
  DevelopmentProcessService,
  EnvironmentDetectionService,
  IdGenerator,
  StorageConfigService,
  TicketRepository,
} from '@project-manager/application'
// Re-export domain types that infrastructure needs
export type {
  Ticket,
  TicketId,
  TicketPriorityKey as TicketPriority,
  TicketStatusKey as TicketStatus,
  TicketTypeKey as TicketType,
} from '@project-manager/domain'
export * from './common/events/node-event-emitter-adapter.ts'
// Event system infrastructure
export * from './common/events/simple-event-emitter.ts'
export * from './infrastructure/adapters/in-memory-ticket-repository.ts'
// Infrastructure implementations
export * from './infrastructure/adapters/json-ticket-repository.ts'
export * from './infrastructure/errors/infrastructure-errors.ts'
export * from './infrastructure/services/cross-platform-storage-config-service.ts'
export * from './infrastructure/services/crypto-id-generator.ts'
export * from './infrastructure/services/node-environment-detection-service.ts'
export * from './infrastructure/services/xdg-development-process-service.ts'
export * from './infrastructure/services/xdg-storage-config-service.ts'
export * from './infrastructure/types/persistence-types.ts'
export * from './logging/file-audit-reader.ts'
export * from './logging/file-log-reader.ts'
// Logging infrastructure
export * from './logging/index.ts'
// Services
export * from './services/async-local-storage-context-service.ts'
