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
  IdGenerator: Symbol('IdGenerator'),
  AliasGenerator: Symbol('AliasGenerator'),

  // Logging Services
  AsyncContextStorage: Symbol('AsyncContextStorage'),
  LoggerFactory: Symbol('LoggerFactory'),
  BaseLogger: Symbol('BaseLogger'),
  AuditLogger: Symbol('AuditLogger'),
  ApplicationLogger: Symbol('ApplicationLogger'),
  AuditInterceptor: Symbol('AuditInterceptor'),
  LoggingContextService: Symbol('LoggingContextService'),

  // Use Cases
  CreateTicketUseCase: Symbol('CreateTicketUseCase'),
  GetTicketByIdUseCase: Symbol('GetTicketByIdUseCase'),
  UpdateTicketStatusUseCase: Symbol('UpdateTicketStatusUseCase'),
  UpdateTicketContentUseCase: Symbol('UpdateTicketContentUseCase'),
  UpdateTicketPriorityUseCase: Symbol('UpdateTicketPriorityUseCase'),
  DeleteTicketUseCase: Symbol('DeleteTicketUseCase'),
  SearchTicketsUseCase: Symbol('SearchTicketsUseCase'),
  GetLogsUseCase: Symbol('GetLogsUseCase'),
  GetAuditLogsUseCase: Symbol('GetAuditLogsUseCase'),
  AddCustomAliasUseCase: Symbol('AddCustomAliasUseCase'),

  // Readers for logs and audit
  LogReader: Symbol('LogReader'),
  AuditReader: Symbol('AuditReader'),
} as const
