/**
 * CLI-specific dependency injection container configuration
 * This creates a CLI-specific container that wraps the core package functionality
 */

import {
  ArchiveTicketUseCase,
  CompleteTicketUseCase,
  type CreateTicket,
  CreateTicketUseCase,
  DeleteTicketUseCase,
  type GetAllTickets,
  GetAllTicketsUseCase,
  type GetTicketById,
  GetTicketByIdUseCase,
  GetTicketStatsUseCase,
  JsonTicketRepository,
  SearchTicketsUseCase,
  StartTicketProgressUseCase,
  type TicketRepository,
  UpdateTicketDescriptionUseCase,
  UpdateTicketPriorityUseCase,
  UpdateTicketStatusUseCase,
  UpdateTicketTitleUseCase,
  UpdateTicketUseCase,
} from '@project-manager/core'
import { Container } from 'inversify'

// CLI-specific dependency injection symbols
export const CLI_TYPES = {
  // Repository
  TicketRepository: Symbol.for('TicketRepository'),

  // Use cases
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
  UpdateTicketUseCase: Symbol.for('UpdateTicketUseCase'),
} as const

/**
 * Create and configure CLI-specific dependency injection container
 */
export function createCliContainer(_storagePath: string): Container {
  const container = new Container()

  // Repository
  container
    .bind<TicketRepository>(CLI_TYPES.TicketRepository)
    .to(JsonTicketRepository)
    .inSingletonScope()

  // Use cases
  container
    .bind<CreateTicket.UseCase>(CLI_TYPES.CreateTicketUseCase)
    .to(CreateTicketUseCase)
    .inTransientScope()

  container
    .bind<GetTicketById.UseCase>(CLI_TYPES.GetTicketByIdUseCase)
    .to(GetTicketByIdUseCase)
    .inTransientScope()

  container
    .bind<GetAllTickets.UseCase>(CLI_TYPES.GetAllTicketsUseCase)
    .to(GetAllTicketsUseCase)
    .inTransientScope()

  container
    .bind<UpdateTicketTitleUseCase>(CLI_TYPES.UpdateTicketTitleUseCase)
    .to(UpdateTicketTitleUseCase)
    .inTransientScope()

  container
    .bind<UpdateTicketDescriptionUseCase>(CLI_TYPES.UpdateTicketDescriptionUseCase)
    .to(UpdateTicketDescriptionUseCase)
    .inTransientScope()

  container
    .bind<UpdateTicketStatusUseCase>(CLI_TYPES.UpdateTicketStatusUseCase)
    .to(UpdateTicketStatusUseCase)
    .inTransientScope()

  container
    .bind<UpdateTicketPriorityUseCase>(CLI_TYPES.UpdateTicketPriorityUseCase)
    .to(UpdateTicketPriorityUseCase)
    .inTransientScope()

  container
    .bind<StartTicketProgressUseCase>(CLI_TYPES.StartTicketProgressUseCase)
    .to(StartTicketProgressUseCase)
    .inTransientScope()

  container
    .bind<CompleteTicketUseCase>(CLI_TYPES.CompleteTicketUseCase)
    .to(CompleteTicketUseCase)
    .inTransientScope()

  container
    .bind<ArchiveTicketUseCase>(CLI_TYPES.ArchiveTicketUseCase)
    .to(ArchiveTicketUseCase)
    .inTransientScope()

  container
    .bind<DeleteTicketUseCase>(CLI_TYPES.DeleteTicketUseCase)
    .to(DeleteTicketUseCase)
    .inTransientScope()

  container
    .bind<GetTicketStatsUseCase>(CLI_TYPES.GetTicketStatsUseCase)
    .to(GetTicketStatsUseCase)
    .inTransientScope()

  container
    .bind<SearchTicketsUseCase>(CLI_TYPES.SearchTicketsUseCase)
    .to(SearchTicketsUseCase)
    .inTransientScope()

  container
    .bind<UpdateTicketUseCase>(CLI_TYPES.UpdateTicketUseCase)
    .to(UpdateTicketUseCase)
    .inTransientScope()

  return container
}

let _container: Container | null = null

/**
 * Get CLI-specific container instance
 */
export function getCliContainer(storagePath: string): Container {
  if (!_container) {
    _container = createCliContainer(storagePath)
  }
  return _container
}

/**
 * Reset CLI container (useful for testing)
 */
export function resetCliContainer(): void {
  _container = null
}
