import type {
  CreateTicket,
  DeleteTicket,
  GetTicketById,
  SearchTickets,
  UpdateTicketContent,
  UpdateTicketPriority,
  UpdateTicketStatus,
} from '@project-manager/application'
import type { Container } from 'inversify'
import { SdkContainerError } from '../common/errors/sdk-errors.ts'
import { TYPES } from '../internal/types.ts'

/**
 * Factory provider for use cases using dependency injection container
 * Provides lazy-loaded, cached access to use case instances
 */
export class UseCaseFactoryProvider {
  private container: Container
  private cache: Map<symbol, any> = new Map()

  constructor(container: Container) {
    if (!container) {
      throw new SdkContainerError('Container is required')
    }
    this.container = container
  }

  /**
   * Get CreateTicket use case
   */
  getCreateTicketUseCase(): CreateTicket.UseCase {
    return this.getCachedUseCase<CreateTicket.UseCase>(TYPES.CreateTicketUseCase)
  }

  /**
   * Get GetTicketById use case
   */
  getGetTicketByIdUseCase(): GetTicketById.UseCase {
    return this.getCachedUseCase<GetTicketById.UseCase>(TYPES.GetTicketByIdUseCase)
  }

  /**
   * Get UpdateTicketStatus use case
   */
  getUpdateTicketStatusUseCase(): UpdateTicketStatus.UseCase {
    return this.getCachedUseCase<UpdateTicketStatus.UseCase>(TYPES.UpdateTicketStatusUseCase)
  }

  /**
   * Get UpdateTicketContent use case
   */
  getUpdateTicketContentUseCase(): UpdateTicketContent.UseCase {
    return this.getCachedUseCase<UpdateTicketContent.UseCase>(TYPES.UpdateTicketContentUseCase)
  }

  /**
   * Get UpdateTicketPriority use case
   */
  getUpdateTicketPriorityUseCase(): UpdateTicketPriority.UseCase {
    return this.getCachedUseCase<UpdateTicketPriority.UseCase>(TYPES.UpdateTicketPriorityUseCase)
  }

  /**
   * Get DeleteTicket use case
   */
  getDeleteTicketUseCase(): DeleteTicket.UseCase {
    return this.getCachedUseCase<DeleteTicket.UseCase>(TYPES.DeleteTicketUseCase)
  }

  /**
   * Get SearchTickets use case
   */
  getSearchTicketsUseCase(): SearchTickets.UseCase {
    return this.getCachedUseCase<SearchTickets.UseCase>(TYPES.SearchTicketsUseCase)
  }

  /**
   * Get cached use case or create new one
   */
  private getCachedUseCase<T>(type: symbol): T {
    if (!this.cache.has(type)) {
      const useCase = this.container.get<T>(type)
      this.cache.set(type, useCase)
    }
    return this.cache.get(type) as T
  }
}
