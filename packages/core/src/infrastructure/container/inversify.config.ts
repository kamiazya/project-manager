import { Container } from 'inversify'
import {
  type TicketRepository,
  TicketRepository as TicketRepositorySymbol,
} from '../../application/repositories/ticket-repository.ts'
import { ArchiveTicket } from '../../application/usecases/archive-ticket.ts'
import { CompleteTicket } from '../../application/usecases/complete-ticket.ts'
// Individual use cases
import { CreateTicket } from '../../application/usecases/create-ticket.ts'
import { DeleteTicket } from '../../application/usecases/delete-ticket.ts'
import { GetAllTickets } from '../../application/usecases/get-all-tickets.ts'
import { GetTicketById } from '../../application/usecases/get-ticket-by-id.ts'
import { GetTicketStats } from '../../application/usecases/get-ticket-stats.ts'
import { SearchTickets } from '../../application/usecases/search-tickets.ts'
import { StartTicketProgress } from '../../application/usecases/start-ticket-progress.ts'
import { UpdateTicket } from '../../application/usecases/update-ticket.ts'
import { UpdateTicketDescription } from '../../application/usecases/update-ticket-description.ts'
import { UpdateTicketPriority } from '../../application/usecases/update-ticket-priority.ts'
import { UpdateTicketStatus } from '../../application/usecases/update-ticket-status.ts'
import { UpdateTicketTitle } from '../../application/usecases/update-ticket-title.ts'
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
