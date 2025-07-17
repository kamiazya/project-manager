import {
  ArchiveTicket,
  CompleteTicket,
  CreateTicket,
  DeleteTicket,
  GetAllTickets,
  GetTicketById,
  GetTicketStats,
  SearchTickets,
  StartTicketProgress,
  type TicketRepository,
  TicketRepository as TicketRepositorySymbol,
  UpdateTicket,
  UpdateTicketDescription,
  UpdateTicketPriority,
  UpdateTicketStatus,
  UpdateTicketTitle,
} from '@project-manager/application'
import { Container } from 'inversify'
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
      return new CreateTicket.UseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<GetTicketById.UseCase>(TYPES.GetTicketByIdUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new GetTicketById.UseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<GetAllTickets.UseCase>(TYPES.GetAllTicketsUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new GetAllTickets.UseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<UpdateTicket.UseCase>(TYPES.UpdateTicketUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new UpdateTicket.UseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<UpdateTicketTitle.UseCase>(TYPES.UpdateTicketTitleUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new UpdateTicketTitle.UseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<UpdateTicketDescription.UseCase>(TYPES.UpdateTicketDescriptionUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new UpdateTicketDescription.UseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<UpdateTicketStatus.UseCase>(TYPES.UpdateTicketStatusUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new UpdateTicketStatus.UseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<UpdateTicketPriority.UseCase>(TYPES.UpdateTicketPriorityUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new UpdateTicketPriority.UseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<StartTicketProgress.UseCase>(TYPES.StartTicketProgressUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new StartTicketProgress.UseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<CompleteTicket.UseCase>(TYPES.CompleteTicketUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new CompleteTicket.UseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<ArchiveTicket.UseCase>(TYPES.ArchiveTicketUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new ArchiveTicket.UseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<DeleteTicket.UseCase>(TYPES.DeleteTicketUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new DeleteTicket.UseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<GetTicketStats.UseCase>(TYPES.GetTicketStatsUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new GetTicketStats.UseCase(ticketRepository)
    })
    .inSingletonScope()
  container
    .bind<SearchTickets.UseCase>(TYPES.SearchTicketsUseCase)
    .toDynamicValue(() => {
      const ticketRepository = container.get<TicketRepository>(TicketRepositorySymbol)
      return new SearchTickets.UseCase(ticketRepository)
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
