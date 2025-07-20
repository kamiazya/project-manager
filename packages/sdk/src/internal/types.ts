/**
 * Internal Symbol definitions for dependency injection
 * These symbols are used internally by the SDK and should not be exported
 */

export const TYPES = {
  // Repository
  TicketRepository: Symbol('TicketRepository'),

  // Services
  StorageConfigService: Symbol('StorageConfigService'),
  DevelopmentProcessService: Symbol('DevelopmentProcessService'),
  EnvironmentDetectionService: Symbol('EnvironmentDetectionService'),

  // Use Cases
  CreateTicketUseCase: Symbol('CreateTicketUseCase'),
  GetTicketByIdUseCase: Symbol('GetTicketByIdUseCase'),
  UpdateTicketStatusUseCase: Symbol('UpdateTicketStatusUseCase'),
  UpdateTicketContentUseCase: Symbol('UpdateTicketContentUseCase'),
  UpdateTicketPriorityUseCase: Symbol('UpdateTicketPriorityUseCase'),
  UpdateTicketTitleUseCase: Symbol('UpdateTicketTitleUseCase'),
  DeleteTicketUseCase: Symbol('DeleteTicketUseCase'),
  SearchTicketsUseCase: Symbol('SearchTicketsUseCase'),
} as const
