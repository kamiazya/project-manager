/**
 * Internal inversify container configuration
 * This file handles all dependency injection setup for the SDK
 */

import { join } from 'node:path'
import {
  CreateTicket,
  DeleteTicket,
  type DevelopmentProcessService,
  type EnvironmentDetectionService,
  GetTicketById,
  SearchTickets,
  type StorageConfigService,
  type TicketRepository,
  UpdateTicketContent,
  UpdateTicketPriority,
  UpdateTicketStatus,
  UpdateTicketTitle,
} from '@project-manager/application'
import { isDevelopmentLike, isMemoryEnvironment } from '@project-manager/base'
import {
  InMemoryTicketRepository,
  JsonTicketRepository,
  NodeEnvironmentDetectionService,
  XdgDevelopmentProcessService,
  XdgStorageConfigService,
} from '@project-manager/infrastructure'
import { Container } from 'inversify'
import type { SDKConfig } from '../project-manager-sdk.ts'
import { TYPES } from './types.ts'

export function createContainer(config: SDKConfig): Container {
  const container = new Container({
    defaultScope: 'Singleton',
  })

  // Environment Detection Service - binds concrete implementation
  container
    .bind<EnvironmentDetectionService>(TYPES.EnvironmentDetectionService)
    .toDynamicValue(() => new NodeEnvironmentDetectionService())
    .inSingletonScope()

  // Storage Config Service - binds XDG Base Directory implementation
  container
    .bind<StorageConfigService>(TYPES.StorageConfigService)
    .toDynamicValue(() => {
      // Get environment mode for storage directory naming
      const envService = container.get<EnvironmentDetectionService>(
        TYPES.EnvironmentDetectionService
      )
      const environment = envService.resolveEnvironment(config.environment)

      // Create service with environment context
      const service = new XdgStorageConfigService()
      // Override getDefaultStoragePath to use environment-specific directory
      service.getDefaultStoragePath = () => {
        const storageDir = service.getDefaultStorageDir(environment)
        return join(storageDir, 'tickets.json')
      }

      return service
    })
    .inSingletonScope()

  // Repository binding - environment-based selection
  container
    .bind<TicketRepository>(TYPES.TicketRepository)
    .toDynamicValue(() => {
      // Resolve environment and create appropriate repository
      const envService = container.get<EnvironmentDetectionService>(
        TYPES.EnvironmentDetectionService
      )
      const environment = envService.resolveEnvironment(config.environment)

      if (isMemoryEnvironment(environment)) {
        return new InMemoryTicketRepository()
      } else {
        // Use StorageConfigService for path resolution (Clean Architecture compliant)
        const storageService = container.get<StorageConfigService>(TYPES.StorageConfigService)
        const storagePath = storageService.resolveStoragePath()
        return new JsonTicketRepository(storagePath)
      }
    })
    .inSingletonScope()

  // Development Process Service - conditional binding for development-like environments
  const envService = new NodeEnvironmentDetectionService()
  const environment = envService.resolveEnvironment(config.environment)
  if (isDevelopmentLike(environment)) {
    container
      .bind<DevelopmentProcessService>(TYPES.DevelopmentProcessService)
      .toDynamicValue(() => {
        return new XdgDevelopmentProcessService(environment)
      })
      .inSingletonScope()
  }

  // Use case bindings
  container.bind(TYPES.CreateTicketUseCase).toDynamicValue(() => {
    const repo = container.get<TicketRepository>(TYPES.TicketRepository)
    return new CreateTicket.UseCase(repo)
  })

  container.bind(TYPES.GetTicketByIdUseCase).toDynamicValue(() => {
    const repo = container.get<TicketRepository>(TYPES.TicketRepository)
    return new GetTicketById.UseCase(repo)
  })

  container.bind(TYPES.UpdateTicketStatusUseCase).toDynamicValue(() => {
    const repo = container.get<TicketRepository>(TYPES.TicketRepository)
    return new UpdateTicketStatus.UseCase(repo)
  })

  container.bind(TYPES.UpdateTicketContentUseCase).toDynamicValue(() => {
    const repo = container.get<TicketRepository>(TYPES.TicketRepository)
    return new UpdateTicketContent.UseCase(repo)
  })

  container.bind(TYPES.UpdateTicketPriorityUseCase).toDynamicValue(() => {
    const repo = container.get<TicketRepository>(TYPES.TicketRepository)
    return new UpdateTicketPriority.UseCase(repo)
  })

  container.bind(TYPES.UpdateTicketTitleUseCase).toDynamicValue(() => {
    const repo = container.get<TicketRepository>(TYPES.TicketRepository)
    return new UpdateTicketTitle.UseCase(repo)
  })

  container.bind(TYPES.DeleteTicketUseCase).toDynamicValue(() => {
    const repo = container.get<TicketRepository>(TYPES.TicketRepository)
    return new DeleteTicket.UseCase(repo)
  })

  container.bind(TYPES.SearchTicketsUseCase).toDynamicValue(() => {
    const repo = container.get<TicketRepository>(TYPES.TicketRepository)
    return new SearchTickets.UseCase(repo)
  })

  return container
}
