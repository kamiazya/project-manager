import 'reflect-metadata'
import { Container } from 'inversify'
import { JsonTicketRepository } from '../adapters/json-ticket-repository.js'
import type { ITicketRepository } from '../ports/ticket-repository.js'
import { TicketUseCase } from '../usecases/ticket-usecase.js'
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
    .bind<ITicketRepository>(TYPES.TicketRepository)
    .toDynamicValue(() => {
      const path = container.isBound(TYPES.StoragePath)
        ? container.get<string>(TYPES.StoragePath)
        : undefined
      return new JsonTicketRepository(path)
    })
    .inSingletonScope()

  // Bind use case
  container
    .bind<TicketUseCase>(TYPES.TicketUseCase)
    .toDynamicValue(() => {
      const repository = container.get<ITicketRepository>(TYPES.TicketRepository)
      return new TicketUseCase(repository)
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
