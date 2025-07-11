import {
  ArchiveTicketUseCase,
  CompleteTicketUseCase,
  CreateTicketUseCase,
  DeleteTicketUseCase,
  GetAllTicketsUseCase,
  GetTicketByIdUseCase,
  GetTicketStatsUseCase,
  getContainer,
  resetContainer,
  SearchTicketsUseCase,
  StartTicketProgressUseCase,
  TYPES,
  UpdateTicketDescriptionUseCase,
  UpdateTicketPriorityUseCase,
  UpdateTicketStatusUseCase,
  UpdateTicketTitleUseCase,
} from '@project-manager/core'
import type { Container } from 'inversify'
import { getStoragePath } from './config.js'

let _container: Container | null = null

export function getServiceContainer(): Container {
  if (!_container) {
    _container = getContainer(getStoragePath())
  }

  return _container
}

// Individual use case getters
export function getCreateTicketUseCase(): CreateTicketUseCase {
  return getServiceContainer().get<CreateTicketUseCase>(TYPES.CreateTicketUseCase)
}

export function getGetTicketByIdUseCase(): GetTicketByIdUseCase {
  return getServiceContainer().get<GetTicketByIdUseCase>(TYPES.GetTicketByIdUseCase)
}

export function getGetAllTicketsUseCase(): GetAllTicketsUseCase {
  return getServiceContainer().get<GetAllTicketsUseCase>(TYPES.GetAllTicketsUseCase)
}

export function getUpdateTicketTitleUseCase(): UpdateTicketTitleUseCase {
  return getServiceContainer().get<UpdateTicketTitleUseCase>(TYPES.UpdateTicketTitleUseCase)
}

export function getUpdateTicketDescriptionUseCase(): UpdateTicketDescriptionUseCase {
  return getServiceContainer().get<UpdateTicketDescriptionUseCase>(
    TYPES.UpdateTicketDescriptionUseCase
  )
}

export function getUpdateTicketStatusUseCase(): UpdateTicketStatusUseCase {
  return getServiceContainer().get<UpdateTicketStatusUseCase>(TYPES.UpdateTicketStatusUseCase)
}

export function getUpdateTicketPriorityUseCase(): UpdateTicketPriorityUseCase {
  return getServiceContainer().get<UpdateTicketPriorityUseCase>(TYPES.UpdateTicketPriorityUseCase)
}

export function getStartTicketProgressUseCase(): StartTicketProgressUseCase {
  return getServiceContainer().get<StartTicketProgressUseCase>(TYPES.StartTicketProgressUseCase)
}

export function getCompleteTicketUseCase(): CompleteTicketUseCase {
  return getServiceContainer().get<CompleteTicketUseCase>(TYPES.CompleteTicketUseCase)
}

export function getArchiveTicketUseCase(): ArchiveTicketUseCase {
  return getServiceContainer().get<ArchiveTicketUseCase>(TYPES.ArchiveTicketUseCase)
}

export function getDeleteTicketUseCase(): DeleteTicketUseCase {
  return getServiceContainer().get<DeleteTicketUseCase>(TYPES.DeleteTicketUseCase)
}

export function getGetTicketStatsUseCase(): GetTicketStatsUseCase {
  return getServiceContainer().get<GetTicketStatsUseCase>(TYPES.GetTicketStatsUseCase)
}

export function getSearchTicketsUseCase(): SearchTicketsUseCase {
  return getServiceContainer().get<SearchTicketsUseCase>(TYPES.SearchTicketsUseCase)
}

export function resetServiceContainer(): void {
  _container = null
  resetContainer()
}
