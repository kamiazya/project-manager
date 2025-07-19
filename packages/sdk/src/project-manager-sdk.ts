/**
 * ProjectManagerSDK - Facade pattern implementation
 *
 * This class provides a unified interface to all Project Manager functionality,
 * following the Facade pattern to simplify complex subsystem interactions.
 */

import type { TicketRepository, UseCaseFactory } from '@project-manager/application'
// import type { AppConfigSchema } from '@project-manager/base'
import type { TicketPriorityKey, TicketStatusKey, TicketTypeKey } from '@project-manager/domain'

/**
 * Request/Response DTOs for SDK operations
 */
export interface CreateTicketRequest {
  title: string
  description: string
  priority?: TicketPriorityKey
  type?: TicketTypeKey
  status?: TicketStatusKey
}

export interface UpdateTicketRequest {
  id: string
  title?: string
  description?: string
  priority?: TicketPriorityKey
  type?: TicketTypeKey
}

export interface SearchTicketsRequest {
  query?: string
  status?: TicketStatusKey
  priority?: TicketPriorityKey
  type?: TicketTypeKey
  searchIn?: ('title' | 'description')[]
}

export interface TicketResponse {
  id: string
  title: string
  description: string
  status: TicketStatusKey
  priority: TicketPriorityKey
  type: TicketTypeKey
  createdAt: string
  updatedAt: string
}

/**
 * Main SDK class providing unified access to Project Manager functionality
 */
export class ProjectManagerSDK {
  private constructor(private readonly useCaseFactory: UseCaseFactory) {}

  /**
   * Factory method to create SDK instance
   */
  static async create(useCaseFactory: UseCaseFactory): Promise<ProjectManagerSDK> {
    return new ProjectManagerSDK(useCaseFactory)
  }

  /**
   * Ticket Management Operations
   */
  public readonly tickets = {
    /**
     * Create a new ticket
     */
    create: async (request: CreateTicketRequest): Promise<TicketResponse> => {
      const useCase = this.useCaseFactory.createCreateTicketUseCase()
      const createRequest = new (await import('@project-manager/application')).CreateTicket.Request(
        request.title,
        request.description,
        request.priority as string,
        request.type as string,
        request.status || 'pending'
      )

      const response = await useCase.execute(createRequest)
      return this.mapTicketResponseToSDKResponse(response)
    },

    /**
     * Get ticket by ID
     */
    getById: async (id: string): Promise<TicketResponse | null> => {
      const useCase = this.useCaseFactory.createGetTicketByIdUseCase()
      const request = new (await import('@project-manager/application')).GetTicketById.Request(id)

      const response = await useCase.execute(request)
      return response ? this.mapTicketResponseToSDKResponse(response) : null
    },

    /**
     * Get all tickets
     */
    getAll: async (): Promise<TicketResponse[]> => {
      const useCase = this.useCaseFactory.createGetAllTicketsUseCase()
      const request = new (await import('@project-manager/application')).GetAllTickets.Request({})

      const response = await useCase.execute(request)
      return response.tickets.map(ticket => this.mapTicketResponseToSDKResponse(ticket))
    },

    /**
     * Update ticket
     */
    update: async (request: UpdateTicketRequest): Promise<TicketResponse> => {
      const useCase = this.useCaseFactory.createUpdateTicketUseCase()
      const updateRequest = new (await import('@project-manager/application')).UpdateTicket.Request(
        request.id,
        {
          title: request.title,
          description: request.description,
          priority: request.priority as 'high' | 'medium' | 'low' | undefined,
          type: request.type as 'feature' | 'bug' | 'task' | undefined,
        }
      )

      const response = await useCase.execute(updateRequest)
      return this.mapTicketResponseToSDKResponse(response)
    },

    /**
     * Update ticket status
     */
    updateStatus: async (id: string, status: TicketStatusKey): Promise<TicketResponse> => {
      const useCase = this.useCaseFactory.createUpdateTicketStatusUseCase()
      const request = new (await import('@project-manager/application')).UpdateTicketStatus.Request(
        id,
        status as 'pending' | 'in_progress' | 'completed' | 'archived'
      )

      const response = await useCase.execute(request)
      return this.mapTicketResponseToSDKResponse(response)
    },

    /**
     * Delete ticket
     */
    delete: async (id: string): Promise<void> => {
      const useCase = this.useCaseFactory.createDeleteTicketUseCase()
      const request = new (await import('@project-manager/application')).DeleteTicket.Request(id)

      await useCase.execute(request)
    },

    /**
     * Search tickets
     */
    search: async (request: SearchTicketsRequest): Promise<TicketResponse[]> => {
      const useCase = this.useCaseFactory.createSearchTicketsUseCase()
      const searchRequest = new (
        await import('@project-manager/application')
      ).SearchTickets.Request({
        search: request.query,
        status: request.status,
        priority: request.priority,
        type: request.type,
        searchIn: request.searchIn,
      })

      const response = await useCase.execute(searchRequest)
      return response.tickets.map(ticket => this.mapTicketResponseToSDKResponse(ticket))
    },
  }

  /**
   * Configuration Management
   */
  public readonly configuration = {
    /**
     * Get current configuration
     */
    get: async (): Promise<Record<string, any>> => {
      // TODO: Implement configuration use case
      throw new Error('Configuration management not yet implemented')
    },

    /**
     * Update configuration
     */
    update: async (config: Partial<Record<string, any>>): Promise<void> => {
      // TODO: Implement configuration update use case
      throw new Error('Configuration management not yet implemented')
    },

    /**
     * Get storage path from SDK configuration
     */
    getStoragePath: async (): Promise<string> => {
      const repository = this.useCaseFactory.getTicketRepository()
      if ('storagePath' in repository && typeof repository.storagePath === 'string') {
        return repository.storagePath
      }
      // Fallback to infrastructure default
      return await this.getDefaultStoragePathInternal()
    },

    /**
     * Get default storage path (XDG-compliant)
     */
    getDefaultStoragePath: async (): Promise<string> => {
      return await this.getDefaultStoragePathInternal()
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
      return this.useCaseFactory.getTicketRepository()
    },
  }

  /**
   * Helper method to get default storage path
   */
  private async getDefaultStoragePathInternal(): Promise<string> {
    const { homedir } = await import('node:os')
    const { join } = await import('node:path')

    const homeDir = homedir()
    const configHome = process.env.XDG_CONFIG_HOME || join(homeDir, '.config')
    const isDevelopment = process.env.NODE_ENV === 'development'
    const dirName = isDevelopment ? 'project-manager-dev' : 'project-manager'

    return join(configHome, dirName, 'tickets.json')
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
      createdAt: ticketResponse.createdAt,
      updatedAt: ticketResponse.updatedAt,
    }
  }
}
