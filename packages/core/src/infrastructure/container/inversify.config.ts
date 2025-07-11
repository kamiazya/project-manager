import 'reflect-metadata'
import { Container } from 'inversify'
import {
  type TicketRepository,
  TicketRepository as TicketRepositorySymbol,
} from '../../application/repositories/ticket-repository.js'
import { ArchiveTicketUseCase } from '../../application/usecases/archive-ticket.js'
import { CompleteTicketUseCase } from '../../application/usecases/complete-ticket.js'
// Individual use cases
import { CreateTicketUseCase } from '../../application/usecases/create-ticket.js'
import { DeleteTicketUseCase } from '../../application/usecases/delete-ticket.js'
import { GetAllTicketsUseCase } from '../../application/usecases/get-all-tickets.js'
import { GetTicketByIdUseCase } from '../../application/usecases/get-ticket-by-id.js'
import { GetTicketStatsUseCase } from '../../application/usecases/get-ticket-stats.js'
import { SearchTicketsUseCase } from '../../application/usecases/search-tickets.js'
import { StartTicketProgressUseCase } from '../../application/usecases/start-ticket-progress.js'
import { UpdateTicketDescriptionUseCase } from '../../application/usecases/update-ticket-description.js'
import { UpdateTicketPriorityUseCase } from '../../application/usecases/update-ticket-priority.js'
import { UpdateTicketStatusUseCase } from '../../application/usecases/update-ticket-status.js'
import { UpdateTicketTitleUseCase } from '../../application/usecases/update-ticket-title.js'
import { JsonTicketRepository } from '../adapters/json-ticket-repository.js'
import { TYPES } from './types.js'

/**
 * InversifyJS container configuration.
 * Sets up dependency injection bindings for the application.
 */

export function createContainer(storagePath?: string): Container {
  const container = new Container()

  // Bind storage path if provided
  if (storagePath) {
    container.bind<string>(TYPES.StoragePath).toConstantValue(storagePath)
  }

  // Bind repository
  container
    .bind<TicketRepository>(TicketRepositorySymbol)
    .toDynamicValue(() => {
      const path = container.isBound(TYPES.StoragePath)
        ? container.get<string>(TYPES.StoragePath)
        : undefined
      return new JsonTicketRepository(path)
    })
    .inSingletonScope()

  // Bind individual use cases
  container
    .bind<CreateTicketUseCase>(TYPES.CreateTicketUseCase)
    .to(CreateTicketUseCase)
    .inSingletonScope()
  container
    .bind<GetTicketByIdUseCase>(TYPES.GetTicketByIdUseCase)
    .to(GetTicketByIdUseCase)
    .inSingletonScope()
  container
    .bind<GetAllTicketsUseCase>(TYPES.GetAllTicketsUseCase)
    .to(GetAllTicketsUseCase)
    .inSingletonScope()
  container
    .bind<UpdateTicketTitleUseCase>(TYPES.UpdateTicketTitleUseCase)
    .to(UpdateTicketTitleUseCase)
    .inSingletonScope()
  container
    .bind<UpdateTicketDescriptionUseCase>(TYPES.UpdateTicketDescriptionUseCase)
    .to(UpdateTicketDescriptionUseCase)
    .inSingletonScope()
  container
    .bind<UpdateTicketStatusUseCase>(TYPES.UpdateTicketStatusUseCase)
    .to(UpdateTicketStatusUseCase)
    .inSingletonScope()
  container
    .bind<UpdateTicketPriorityUseCase>(TYPES.UpdateTicketPriorityUseCase)
    .to(UpdateTicketPriorityUseCase)
    .inSingletonScope()
  container
    .bind<StartTicketProgressUseCase>(TYPES.StartTicketProgressUseCase)
    .to(StartTicketProgressUseCase)
    .inSingletonScope()
  container
    .bind<CompleteTicketUseCase>(TYPES.CompleteTicketUseCase)
    .to(CompleteTicketUseCase)
    .inSingletonScope()
  container
    .bind<ArchiveTicketUseCase>(TYPES.ArchiveTicketUseCase)
    .to(ArchiveTicketUseCase)
    .inSingletonScope()
  container
    .bind<DeleteTicketUseCase>(TYPES.DeleteTicketUseCase)
    .to(DeleteTicketUseCase)
    .inSingletonScope()
  container
    .bind<GetTicketStatsUseCase>(TYPES.GetTicketStatsUseCase)
    .to(GetTicketStatsUseCase)
    .inSingletonScope()
  container
    .bind<SearchTicketsUseCase>(TYPES.SearchTicketsUseCase)
    .to(SearchTicketsUseCase)
    .inSingletonScope()

  return container
}

// Default container instance
let defaultContainer: Container | null = null

export function getContainer(storagePath?: string): Container {
  if (!defaultContainer) {
    defaultContainer = createContainer(storagePath)
  }
  return defaultContainer
}

export function resetContainer(): void {
  defaultContainer = null
}
