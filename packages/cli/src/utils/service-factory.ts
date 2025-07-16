import {
  ArchiveTicketUseCase,
  CompleteTicketUseCase,
  CreateTicketUseCase,
  DeleteTicketUseCase,
  GetAllTicketsUseCase,
  GetTicketByIdUseCase,
  GetTicketStatsUseCase,
  SearchTicketsUseCase,
  StartTicketProgressUseCase,
  UpdateTicketDescriptionUseCase,
  UpdateTicketPriorityUseCase,
  UpdateTicketStatusUseCase,
  UpdateTicketTitleUseCase,
  UpdateTicketUseCase,
} from '@project-manager/core'
import type { Container } from 'inversify'
import { CLI_TYPES, getCliContainer, resetCliContainer } from '../infrastructure/container.ts'
import { getStoragePath } from './config.ts'

export function getServiceContainer(): Container {
  return getCliContainer(getStoragePath())
}

// Individual use case getters
export function getCreateTicketUseCase(): CreateTicketUseCase {
  return getServiceContainer().get<CreateTicketUseCase>(CLI_TYPES.CreateTicketUseCase)
}

export function getGetTicketByIdUseCase(): GetTicketByIdUseCase {
  return getServiceContainer().get<GetTicketByIdUseCase>(CLI_TYPES.GetTicketByIdUseCase)
}

export function getGetAllTicketsUseCase(): GetAllTicketsUseCase {
  return getServiceContainer().get<GetAllTicketsUseCase>(CLI_TYPES.GetAllTicketsUseCase)
}

export function getUpdateTicketTitleUseCase(): UpdateTicketTitleUseCase {
  return getServiceContainer().get<UpdateTicketTitleUseCase>(CLI_TYPES.UpdateTicketTitleUseCase)
}

export function getUpdateTicketDescriptionUseCase(): UpdateTicketDescriptionUseCase {
  return getServiceContainer().get<UpdateTicketDescriptionUseCase>(
    CLI_TYPES.UpdateTicketDescriptionUseCase
  )
}

export function getUpdateTicketStatusUseCase(): UpdateTicketStatusUseCase {
  return getServiceContainer().get<UpdateTicketStatusUseCase>(CLI_TYPES.UpdateTicketStatusUseCase)
}

export function getUpdateTicketPriorityUseCase(): UpdateTicketPriorityUseCase {
  return getServiceContainer().get<UpdateTicketPriorityUseCase>(
    CLI_TYPES.UpdateTicketPriorityUseCase
  )
}

export function getStartTicketProgressUseCase(): StartTicketProgressUseCase {
  return getServiceContainer().get<StartTicketProgressUseCase>(CLI_TYPES.StartTicketProgressUseCase)
}

export function getCompleteTicketUseCase(): CompleteTicketUseCase {
  return getServiceContainer().get<CompleteTicketUseCase>(CLI_TYPES.CompleteTicketUseCase)
}

export function getArchiveTicketUseCase(): ArchiveTicketUseCase {
  return getServiceContainer().get<ArchiveTicketUseCase>(CLI_TYPES.ArchiveTicketUseCase)
}

export function getDeleteTicketUseCase(): DeleteTicketUseCase {
  return getServiceContainer().get<DeleteTicketUseCase>(CLI_TYPES.DeleteTicketUseCase)
}

export function getGetTicketStatsUseCase(): GetTicketStatsUseCase {
  return getServiceContainer().get<GetTicketStatsUseCase>(CLI_TYPES.GetTicketStatsUseCase)
}

export function getSearchTicketsUseCase(): SearchTicketsUseCase {
  return getServiceContainer().get<SearchTicketsUseCase>(CLI_TYPES.SearchTicketsUseCase)
}

export function getUpdateTicketUseCase(): UpdateTicketUseCase {
  return getServiceContainer().get<UpdateTicketUseCase>(CLI_TYPES.UpdateTicketUseCase)
}

export function resetServiceContainer(): void {
  resetCliContainer()
}
