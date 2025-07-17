/**
 * ProjectManagerSDK - Facade pattern implementation
 *
 * This class provides a unified interface to all Project Manager functionality,
 * following the Facade pattern to simplify complex subsystem interactions.
 */

import type {
  CreateTicket,
  DeleteTicket,
  GetAllTickets,
  GetTicketById,
  GetTicketStats,
  SearchTickets,
  TicketRepository,
  TicketStatistics,
  UpdateTicket,
  UpdateTicketStatus,
  UseCaseFactory,
} from '@project-manager/application'
import type { AppConfigSchema } from '@project-manager/base'
import type {
  Ticket,
  TicketId,
  TicketPriority,
  TicketPrivacy,
  TicketStatus,
  TicketType,
} from '@project-manager/domain'
import type { Container } from 'inversify'

/**
 * Request/Response DTOs for SDK operations
 */
export interface CreateTicketRequest {
  title: string
  description: string
  priority?: TicketPriority
  type?: TicketType
  privacy?: TicketPrivacy
}

export interface UpdateTicketRequest {
  id: string
  title?: string
  description?: string
  priority?: TicketPriority
  type?: TicketType
  privacy?: TicketPrivacy
}

export interface SearchTicketsRequest {
  query?: string
  status?: TicketStatus
  priority?: TicketPriority
  type?: TicketType
  privacy?: TicketPrivacy
  searchIn?: ('title' | 'description')[]
}

export interface TicketResponse {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  type: TicketType
  privacy: TicketPrivacy
  createdAt: string
  updatedAt: string
}

/**
 * Main SDK class providing unified access to Project Manager functionality
 */
export class ProjectManagerSDK {
  private constructor(private readonly container: Container) {}

  /**
   * Factory method to create SDK instance
   */
  static async create(container: Container): Promise<ProjectManagerSDK> {
    return new ProjectManagerSDK(container)
  }

  /**
   * Ticket Management Operations
   */
  public readonly tickets = {
    /**
     * Create a new ticket
     */
    create: async (request: CreateTicketRequest): Promise<TicketResponse> => {
      const useCase = this.container.get<CreateTicket.UseCase>('CreateTicketUseCase')
      const createRequest = new (await import('@project-manager/application')).CreateTicket.Request(
        request.title,
        request.description,
        request.priority,
        request.type,
        request.privacy
      )

      const response = await useCase.execute(createRequest)
      return this.mapTicketResponseToSDKResponse(response)
    },

    /**
     * Get ticket by ID
     */
    getById: async (id: string): Promise<TicketResponse | null> => {
      const useCase = this.container.get<GetTicketById.UseCase>('GetTicketByIdUseCase')
      const request = new (await import('@project-manager/application')).GetTicketById.Request(id)

      const response = await useCase.execute(request)
      return response ? this.mapTicketResponseToSDKResponse(response) : null
    },

    /**
     * Get all tickets
     */
    getAll: async (): Promise<TicketResponse[]> => {
      const useCase = this.container.get<GetAllTickets.UseCase>('GetAllTicketsUseCase')
      const request = new (await import('@project-manager/application')).GetAllTickets.Request({})

      const response = await useCase.execute(request)
      return response.tickets.map(ticket => this.mapTicketResponseToSDKResponse(ticket))
    },

    /**
     * Update ticket
     */
    update: async (request: UpdateTicketRequest): Promise<TicketResponse> => {
      const useCase = this.container.get<UpdateTicket.UseCase>('UpdateTicketUseCase')
      const updateRequest = new (await import('@project-manager/application')).UpdateTicket.Request(
        request.id,
        {
          title: request.title,
          description: request.description,
          priority: request.priority,
          type: request.type,
        }
      )

      const response = await useCase.execute(updateRequest)
      return this.mapTicketResponseToSDKResponse(response)
    },

    /**
     * Update ticket status
     */
    updateStatus: async (id: string, status: TicketStatus): Promise<TicketResponse> => {
      const useCase = this.container.get<UpdateTicketStatus.UseCase>('UpdateTicketStatusUseCase')
      const request = new (await import('@project-manager/application')).UpdateTicketStatus.Request(
        id,
        status
      )

      const response = await useCase.execute(request)
      return this.mapTicketResponseToSDKResponse(response)
    },

    /**
     * Delete ticket
     */
    delete: async (id: string): Promise<void> => {
      const useCase = this.container.get<DeleteTicket.UseCase>('DeleteTicketUseCase')
      const request = new (await import('@project-manager/application')).DeleteTicket.Request(id)

      await useCase.execute(request)
    },

    /**
     * Search tickets
     */
    search: async (request: SearchTicketsRequest): Promise<TicketResponse[]> => {
      const useCase = this.container.get<SearchTickets.UseCase>('SearchTicketsUseCase')
      const searchRequest = new (
        await import('@project-manager/application')
      ).SearchTickets.Request({
        search: request.query,
        status: request.status,
        priority: request.priority,
        type: request.type,
        privacy: request.privacy,
        searchIn: request.searchIn,
      })

      const response = await useCase.execute(searchRequest)
      return response.tickets.map(ticket => this.mapTicketResponseToSDKResponse(ticket))
    },

    /**
     * Get ticket statistics
     */
    getStats: async (): Promise<TicketStatistics> => {
      const useCase = this.container.get<GetTicketStats.UseCase>('GetTicketStatsUseCase')
      const request = new (await import('@project-manager/application')).GetTicketStats.Request()

      const response = await useCase.execute(request)
      return response
    },
  }

  /**
   * Configuration Management
   */
  public readonly configuration = {
    /**
     * Get current configuration
     */
    get: async (): Promise<AppConfigSchema> => {
      const factory = this.container.get<UseCaseFactory>('UseCaseFactory')
      // TODO: Implement configuration use case
      throw new Error('Configuration management not yet implemented')
    },

    /**
     * Update configuration
     */
    update: async (config: Partial<AppConfigSchema>): Promise<void> => {
      const factory = this.container.get<UseCaseFactory>('UseCaseFactory')
      // TODO: Implement configuration update use case
      throw new Error('Configuration management not yet implemented')
    },
  }

  /**
   * Repository Access (for advanced usage)
   */
  public readonly repository = {
    /**
     * Get ticket repository instance
     */
    getTicketRepository: (): TicketRepository => {
      return this.container.get<TicketRepository>('TicketRepository')
    },
  }

  /**
   * Helper method to map TicketResponse from Application layer to SDK Response DTO
   */
  private mapTicketResponseToSDKResponse(ticketResponse: any): TicketResponse {
    return {
      id: ticketResponse.id,
      title: ticketResponse.title,
      description: ticketResponse.description,
      status: ticketResponse.status,
      priority: ticketResponse.priority,
      type: ticketResponse.type,
      privacy: ticketResponse.privacy,
      createdAt: ticketResponse.createdAt,
      updatedAt: ticketResponse.updatedAt,
    }
  }
}
