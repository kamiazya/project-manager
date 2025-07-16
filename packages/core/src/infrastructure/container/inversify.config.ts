import { Container } from 'inversify'
import {
  type TicketRepository,
  TicketRepository as TicketRepositorySymbol,
} from '../../application/repositories/ticket-repository.ts'
import { ArchiveTicketUseCase } from '../../application/usecases/archive-ticket.ts'
import { CompleteTicketUseCase } from '../../application/usecases/complete-ticket.ts'
// Individual use cases
import { type CreateTicket, CreateTicketUseCase } from '../../application/usecases/create-ticket.ts'
import { DeleteTicketUseCase } from '../../application/usecases/delete-ticket.ts'
import {
  type GetAllTickets,
  GetAllTicketsUseCase,
} from '../../application/usecases/get-all-tickets.ts'
import {
  type GetTicketById,
  GetTicketByIdUseCase,
} from '../../application/usecases/get-ticket-by-id.ts'
import { GetTicketStatsUseCase } from '../../application/usecases/get-ticket-stats.ts'
import { SearchTicketsUseCase } from '../../application/usecases/search-tickets.ts'
import { StartTicketProgressUseCase } from '../../application/usecases/start-ticket-progress.ts'
import { UpdateTicketUseCase } from '../../application/usecases/update-ticket.ts'
import { UpdateTicketDescriptionUseCase } from '../../application/usecases/update-ticket-description.ts'
import { UpdateTicketPriorityUseCase } from '../../application/usecases/update-ticket-priority.ts'
import { UpdateTicketStatusUseCase } from '../../application/usecases/update-ticket-status.ts'
import { UpdateTicketTitleUseCase } from '../../application/usecases/update-ticket-title.ts'
import { JsonTicketRepository } from '../adapters/json-ticket-repository.ts'
import { TYPES } from './types.ts'

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
    .bind<CreateTicket.UseCase>(TYPES.CreateTicketUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new CreateTicketUseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<GetTicketById.UseCase>(TYPES.GetTicketByIdUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new GetTicketByIdUseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<GetAllTickets.UseCase>(TYPES.GetAllTicketsUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new GetAllTicketsUseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<UpdateTicketUseCase>(TYPES.UpdateTicketUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new UpdateTicketUseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<UpdateTicketTitleUseCase>(TYPES.UpdateTicketTitleUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new UpdateTicketTitleUseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<UpdateTicketDescriptionUseCase>(TYPES.UpdateTicketDescriptionUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new UpdateTicketDescriptionUseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<UpdateTicketStatusUseCase>(TYPES.UpdateTicketStatusUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new UpdateTicketStatusUseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<UpdateTicketPriorityUseCase>(TYPES.UpdateTicketPriorityUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new UpdateTicketPriorityUseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<StartTicketProgressUseCase>(TYPES.StartTicketProgressUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new StartTicketProgressUseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<CompleteTicketUseCase>(TYPES.CompleteTicketUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new CompleteTicketUseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<ArchiveTicketUseCase>(TYPES.ArchiveTicketUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new ArchiveTicketUseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<DeleteTicketUseCase>(TYPES.DeleteTicketUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new DeleteTicketUseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<GetTicketStatsUseCase>(TYPES.GetTicketStatsUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new GetTicketStatsUseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<SearchTicketsUseCase>(TYPES.SearchTicketsUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new SearchTicketsUseCase(ticketRepository)
    })
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
