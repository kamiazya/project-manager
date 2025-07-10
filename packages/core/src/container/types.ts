/**
 * Dependency injection type identifiers for InversifyJS container.
 * These symbols are used to uniquely identify services in the DI container.
 */

export const TYPES = {
  // Repository layer
  TicketRepository: Symbol.for('TicketRepository'),

  // Use case layer
  TicketUseCase: Symbol.for('TicketUseCase'),

  // Configuration
  StoragePath: Symbol.for('StoragePath'),
} as const

export type DITypes = typeof TYPES
