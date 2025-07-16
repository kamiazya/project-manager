/**
 * Service identifiers for CLI dependency injection
 * These are used to register and resolve services in the Inversify container
 */
export const CLI_TYPES = {
  // Use Cases
  CreateTicketUseCase: 'CreateTicketUseCase',
  GetTicketByIdUseCase: 'GetTicketByIdUseCase',
  GetAllTicketsUseCase: 'GetAllTicketsUseCase',
  UpdateTicketUseCase: 'UpdateTicketUseCase',
  UpdateTicketTitleUseCase: 'UpdateTicketTitleUseCase',
  UpdateTicketDescriptionUseCase: 'UpdateTicketDescriptionUseCase',
  UpdateTicketStatusUseCase: 'UpdateTicketStatusUseCase',
  UpdateTicketPriorityUseCase: 'UpdateTicketPriorityUseCase',
  StartTicketProgressUseCase: 'StartTicketProgressUseCase',
  CompleteTicketUseCase: 'CompleteTicketUseCase',
  ArchiveTicketUseCase: 'ArchiveTicketUseCase',
  DeleteTicketUseCase: 'DeleteTicketUseCase',
  GetTicketStatsUseCase: 'GetTicketStatsUseCase',
  SearchTicketsUseCase: 'SearchTicketsUseCase',

  // Repository
  TicketRepository: 'TicketRepository',
} as const

export type CLI_TYPES = (typeof CLI_TYPES)[keyof typeof CLI_TYPES]
