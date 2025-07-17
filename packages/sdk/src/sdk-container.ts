/**
 * SDK Container Factory
 *
 * Creates and configures the Dependency Injection container for the SDK
 */

import type {
  CreateTicket,
  DeleteTicket,
  GetAllTickets,
  GetTicketById,
  GetTicketStats,
  SearchTickets,
  TicketRepository,
  UpdateTicket,
  UpdateTicketStatus,
  UseCaseFactory,
  UseCaseFactoryProvider,
} from '@project-manager/application'
import { Container } from 'inversify'

/**
 * SDK Configuration options
 */
export interface SDKConfig {
  /**
   * Storage path for data files
   */
  storagePath?: string

  /**
   * Environment configuration
   */
  environment?: 'development' | 'production' | 'test'

  /**
   * Custom repository implementation
   */
  customRepository?: TicketRepository
}

/**
 * Creates and configures DI container for SDK
 */
export class SDKContainer {
  private static instance: Container | null = null

  /**
   * Create configured DI container
   */
  static async create(config: SDKConfig = {}): Promise<Container> {
    // Skip singleton for test environment to ensure test isolation
    if (SDKContainer.instance && config.environment !== 'test') {
      return SDKContainer.instance
    }

    const container = new Container()

    // Import required modules
    const applicationModule = await import('@project-manager/application')
    const infrastructureModule = await import('@project-manager/infrastructure')

    // Configure storage path
    const storagePath = config.storagePath || infrastructureModule.getStoragePath()

    // Configure repository
    const repository =
      config.customRepository || new infrastructureModule.JsonTicketRepository(storagePath)
    container.bind<TicketRepository>('TicketRepository').toConstantValue(repository)

    // Configure Use Case Factory
    const provider = applicationModule.UseCaseFactoryProvider.getInstance()
    const factory = provider.createUseCaseFactory({ ticketRepository: repository })

    container.bind<UseCaseFactoryProvider>('UseCaseFactoryProvider').toConstantValue(provider)

    container.bind<UseCaseFactory>('UseCaseFactory').toConstantValue(factory)

    // Use the already configured factory for use cases

    // Configure individual Use Cases directly
    container
      .bind<CreateTicket.UseCase>('CreateTicketUseCase')
      .toConstantValue(factory.createCreateTicketUseCase())

    container
      .bind<GetTicketById.UseCase>('GetTicketByIdUseCase')
      .toConstantValue(factory.createGetTicketByIdUseCase())

    container
      .bind<GetAllTickets.UseCase>('GetAllTicketsUseCase')
      .toConstantValue(factory.createGetAllTicketsUseCase())

    container
      .bind<UpdateTicket.UseCase>('UpdateTicketUseCase')
      .toConstantValue(factory.createUpdateTicketUseCase())

    container
      .bind<UpdateTicketStatus.UseCase>('UpdateTicketStatusUseCase')
      .toConstantValue(factory.createUpdateTicketStatusUseCase())

    container
      .bind<DeleteTicket.UseCase>('DeleteTicketUseCase')
      .toConstantValue(factory.createDeleteTicketUseCase())

    container
      .bind<SearchTickets.UseCase>('SearchTicketsUseCase')
      .toConstantValue(factory.createSearchTicketsUseCase())

    container
      .bind<GetTicketStats.UseCase>('GetTicketStatsUseCase')
      .toConstantValue(factory.createGetTicketStatsUseCase())

    // Don't cache instance in test environment to ensure test isolation
    if (config.environment !== 'test') {
      SDKContainer.instance = container
    }
    return container
  }

  /**
   * Reset container instance (for testing)
   */
  static reset(): void {
    SDKContainer.instance = null
  }
}
