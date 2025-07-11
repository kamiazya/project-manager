/**
 * Dependency injection type identifiers for InversifyJS container.
 * These symbols are used to uniquely identify services in the DI container.
 */

export const TYPES = {
  // Repository layer
  TicketRepository: Symbol.for('TicketRepository'),

  // Individual use cases
  CreateTicketUseCase: Symbol.for('CreateTicketUseCase'),
  GetTicketByIdUseCase: Symbol.for('GetTicketByIdUseCase'),
  GetAllTicketsUseCase: Symbol.for('GetAllTicketsUseCase'),
  UpdateTicketTitleUseCase: Symbol.for('UpdateTicketTitleUseCase'),
  UpdateTicketDescriptionUseCase: Symbol.for('UpdateTicketDescriptionUseCase'),
  UpdateTicketStatusUseCase: Symbol.for('UpdateTicketStatusUseCase'),
  UpdateTicketPriorityUseCase: Symbol.for('UpdateTicketPriorityUseCase'),
  StartTicketProgressUseCase: Symbol.for('StartTicketProgressUseCase'),
  CompleteTicketUseCase: Symbol.for('CompleteTicketUseCase'),
  ArchiveTicketUseCase: Symbol.for('ArchiveTicketUseCase'),
  DeleteTicketUseCase: Symbol.for('DeleteTicketUseCase'),
  GetTicketStatsUseCase: Symbol.for('GetTicketStatsUseCase'),
  SearchTicketsUseCase: Symbol.for('SearchTicketsUseCase'),

  // Configuration
  StoragePath: Symbol.for('StoragePath'),
} as const

export type DITypes = typeof TYPES
