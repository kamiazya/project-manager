import { getContainer, resetContainer, TicketUseCase, TYPES } from '@project-manager/core'
import type { Container } from 'inversify'
import { getStoragePath } from './config.js'

let _container: Container | null = null

export function getServiceContainer(): Container {
  if (!_container) {
    _container = getContainer(getStoragePath())
  }

  return _container
}

export function getTicketUseCase(): TicketUseCase {
  return getServiceContainer().get<TicketUseCase>(TYPES.TicketUseCase)
}

export function resetServiceContainer(): void {
  _container = null
  resetContainer()
}
