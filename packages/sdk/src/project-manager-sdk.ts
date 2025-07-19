/**
 * ProjectManagerSDK - Facade pattern implementation
 *
 * This class provides a unified interface to all Project Manager functionality,
 * following the Facade pattern to simplify complex subsystem interactions.
 */

import { homedir } from 'node:os'
import { join } from 'node:path'
import {
  type TicketResponse as ApplicationLayerTicketResponse,
  CreateTicket,
  DeleteTicket,
  GetAllTickets,
  GetTicketById,
  SearchTickets,
  type TicketRepository,
  UpdateTicketContent,
  UpdateTicketStatus,
} from '@project-manager/application'
import type { UseCaseFactory } from './factories/use-case-factory.ts'
// import type { AppConfigSchema } from '@project-manager/base'

/**
 * Request/Response DTOs for SDK operations
 */
export interface CreateTicketRequest {
  title: string
  priority: string
  type: string
  status: string
  description?: string
}

export interface UpdateTicketContentRequest {
  id: string
  title?: string
  description?: string
}

export interface SearchTicketsRequest {
  query?: string
  status?: string
  priority?: string
  type?: string
  searchIn?: ('title' | 'description')[]
}

export interface TicketResponse {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  type: string
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
      const createRequest = new CreateTicket.Request(
        request.title,
        request.priority,
        request.type,
        request.status
      )

      const response = await useCase.execute(createRequest)
      return this.mapTicketResponseToSDKResponse(response)
    },

    /**
     * Get ticket by ID
     */
    getById: async (id: string): Promise<TicketResponse | null> => {
      const useCase = this.useCaseFactory.createGetTicketByIdUseCase()
      const request = new GetTicketById.Request(id)

      const response = await useCase.execute(request)
      return response ? this.mapTicketResponseToSDKResponse(response) : null
    },

    /**
     * Get all tickets
     */
    getAll: async (): Promise<TicketResponse[]> => {
      const useCase = this.useCaseFactory.createGetAllTicketsUseCase()
      const request = new GetAllTickets.Request({})

      const response = await useCase.execute(request)
      return response.tickets.map(ticket => this.mapTicketResponseToSDKResponse(ticket))
    },

    /**
     * Update ticket content (title and description)
     */
    updateContent: async (request: UpdateTicketContentRequest): Promise<TicketResponse> => {
      const useCase = this.useCaseFactory.createUpdateTicketContentUseCase()
      const updateRequest = new UpdateTicketContent.Request(request.id, {
        title: request.title,
        description: request.description,
      })

      const response = await useCase.execute(updateRequest)
      return this.mapTicketResponseToSDKResponse(response)
    },

    /**
     * Update ticket status
     */
    updateStatus: async (id: string, status: string): Promise<TicketResponse> => {
      const useCase = this.useCaseFactory.createUpdateTicketStatusUseCase()
      const request = new UpdateTicketStatus.Request(id, status)

      const response = await useCase.execute(request)
      return this.mapTicketResponseToSDKResponse(response)
    },

    /**
     * Delete ticket
     */
    delete: async (id: string): Promise<void> => {
      const useCase = this.useCaseFactory.createDeleteTicketUseCase()
      const request = new DeleteTicket.Request(id)

      await useCase.execute(request)
    },

    /**
     * Search tickets
     */
    search: async (request: SearchTicketsRequest): Promise<TicketResponse[]> => {
      const useCase = this.useCaseFactory.createSearchTicketsUseCase()
      const searchRequest = new SearchTickets.Request({
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
    update: async (_config: Partial<Record<string, any>>): Promise<void> => {
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
      return this.getDefaultStoragePathInternal()
    },

    /**
     * Get default storage path (XDG-compliant)
     */
    getDefaultStoragePath: async (): Promise<string> => {
      return this.getDefaultStoragePathInternal()
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
  private getDefaultStoragePathInternal(): string {
    const homeDir = homedir()
    const configHome = process.env.XDG_CONFIG_HOME || join(homeDir, '.config')
    const isDevelopment = process.env.NODE_ENV === 'development'
    const dirName = isDevelopment ? 'project-manager-dev' : 'project-manager'

    return join(configHome, dirName, 'tickets.json')
  }

  /**
   * Helper method to map TicketResponse from Application layer to SDK Response DTO
   */
  private mapTicketResponseToSDKResponse(
    ticketResponse: ApplicationLayerTicketResponse
  ): TicketResponse {
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
