import {
  CreateTicket,
  GetAllTickets,
  GetTicketById,
  type UseCaseFactory,
  UseCaseFactoryProvider,
} from '@project-manager/core'
import { Container } from 'inversify'
import { CLI_TYPES } from '../infrastructure/container.ts'
import { CliTicketRepository } from '../infrastructure/repository/cli-ticket-repository.ts'
import { getStoragePath } from './config.ts'

// Singleton factory instance
let factoryInstance: UseCaseFactory | null = null

/**
 * Get the shared UseCaseFactory instance
 * This provides Clean Architecture compliant access to use cases
 */
function getUseCaseFactory(): UseCaseFactory {
  if (!factoryInstance) {
    const provider = UseCaseFactoryProvider.getInstance()
    const ticketRepository = new CliTicketRepository(getStoragePath())
    factoryInstance = provider.createUseCaseFactory({
      ticketRepository,
    })
  }
  return factoryInstance
}

// Individual use case getters using factory pattern
export function getCreateTicketUseCase(): CreateTicket.UseCase {
  return getUseCaseFactory().createCreateTicketUseCase()
}

export function getGetTicketByIdUseCase(): GetTicketById.UseCase {
  return getUseCaseFactory().createGetTicketByIdUseCase()
}

export function getGetAllTicketsUseCase(): GetAllTickets.UseCase {
  return getUseCaseFactory().createGetAllTicketsUseCase()
}

export function getUpdateTicketTitleUseCase() {
  return getUseCaseFactory().createUpdateTicketTitleUseCase()
}

export function getUpdateTicketDescriptionUseCase() {
  return getUseCaseFactory().createUpdateTicketDescriptionUseCase()
}

export function getUpdateTicketStatusUseCase() {
  return getUseCaseFactory().createUpdateTicketStatusUseCase()
}

export function getUpdateTicketPriorityUseCase() {
  return getUseCaseFactory().createUpdateTicketPriorityUseCase()
}

export function getStartTicketProgressUseCase() {
  return getUseCaseFactory().createStartTicketProgressUseCase()
}

export function getCompleteTicketUseCase() {
  return getUseCaseFactory().createCompleteTicketUseCase()
}

export function getArchiveTicketUseCase() {
  return getUseCaseFactory().createArchiveTicketUseCase()
}

export function getDeleteTicketUseCase() {
  return getUseCaseFactory().createDeleteTicketUseCase()
}

export function getGetTicketStatsUseCase() {
  return getUseCaseFactory().createGetTicketStatsUseCase()
}

export function getSearchTicketsUseCase() {
  return getUseCaseFactory().createSearchTicketsUseCase()
}

export function getUpdateTicketUseCase() {
  return getUseCaseFactory().createUpdateTicketUseCase()
}

/**
 * Reset the factory instance (useful for testing)
 */
export function resetServiceContainer(): void {
  factoryInstance = null
  containerInstance = null
  UseCaseFactoryProvider.resetInstance()
}

// Singleton container instance for backward compatibility
let containerInstance: Container | null = null

/**
 * Get the dependency injection container
 * This provides backward compatibility with existing commands
 * @deprecated Use individual use case getters instead
 */
export function getServiceContainer(): Container {
  if (!containerInstance) {
    // Create a new container for backward compatibility
    containerInstance = new Container()

    // Ensure factory is initialized
    const factory = getUseCaseFactory()

    // Register all use cases in the container for backward compatibility
    // This allows existing commands to work while we transition to the new pattern
    containerInstance
      .bind(CLI_TYPES.CreateTicketUseCase)
      .toConstantValue(factory.createCreateTicketUseCase())
    containerInstance
      .bind(CLI_TYPES.GetTicketByIdUseCase)
      .toConstantValue(factory.createGetTicketByIdUseCase())
    containerInstance
      .bind(CLI_TYPES.GetAllTicketsUseCase)
      .toConstantValue(factory.createGetAllTicketsUseCase())
    containerInstance
      .bind(CLI_TYPES.UpdateTicketTitleUseCase)
      .toConstantValue(factory.createUpdateTicketTitleUseCase())
    containerInstance
      .bind(CLI_TYPES.UpdateTicketDescriptionUseCase)
      .toConstantValue(factory.createUpdateTicketDescriptionUseCase())
    containerInstance
      .bind(CLI_TYPES.UpdateTicketStatusUseCase)
      .toConstantValue(factory.createUpdateTicketStatusUseCase())
    containerInstance
      .bind(CLI_TYPES.UpdateTicketPriorityUseCase)
      .toConstantValue(factory.createUpdateTicketPriorityUseCase())
    containerInstance
      .bind(CLI_TYPES.StartTicketProgressUseCase)
      .toConstantValue(factory.createStartTicketProgressUseCase())
    containerInstance
      .bind(CLI_TYPES.CompleteTicketUseCase)
      .toConstantValue(factory.createCompleteTicketUseCase())
    containerInstance
      .bind(CLI_TYPES.ArchiveTicketUseCase)
      .toConstantValue(factory.createArchiveTicketUseCase())
    containerInstance
      .bind(CLI_TYPES.DeleteTicketUseCase)
      .toConstantValue(factory.createDeleteTicketUseCase())
    containerInstance
      .bind(CLI_TYPES.GetTicketStatsUseCase)
      .toConstantValue(factory.createGetTicketStatsUseCase())
    containerInstance
      .bind(CLI_TYPES.SearchTicketsUseCase)
      .toConstantValue(factory.createSearchTicketsUseCase())
    containerInstance
      .bind(CLI_TYPES.UpdateTicketUseCase)
      .toConstantValue(factory.createUpdateTicketUseCase())
  }
  return containerInstance
}
