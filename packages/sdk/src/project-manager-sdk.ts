/**
 * ProjectManagerSDK - Facade pattern implementation
 *
 * This class provides a unified interface to all Project Manager functionality,
 * following the Facade pattern to simplify complex subsystem interactions.
 */

import {
  type TicketResponse as ApplicationLayerTicketResponse,
  CreateTicket,
  DeleteTicket,
  type DevelopmentProcessService,
  type EnvironmentDetectionService,
  GetTicketById,
  SearchTickets,
  UpdateTicketContent,
  UpdateTicketStatus,
} from '@project-manager/application'
import { type EnvironmentMode, isDevelopmentLike } from '@project-manager/base'
import type { Container } from 'inversify'
import { createContainer } from './internal/container.ts'
import { TYPES } from './internal/types.ts'

/**
 * SDK Configuration options
 */
export interface SDKConfig {
  /**
   * Environment operational mode
   * - 'auto': Automatically detect environment based on runtime context (default)
   * - 'production': File-based storage, production optimizations
   * - 'development': File-based storage with debug features
   * - 'testing': Memory-based storage for tests
   * - 'in-memory': Memory-based storage for temporary use
   * - 'isolated': File-based storage in isolated directory
   */
  environment?: EnvironmentMode | 'auto'
}

/**
 * Request/Response DTOs for SDK operations
 */
export interface CreateTicketRequest {
  title: string
  type?: string
  description?: string
  status?: string
  priority?: string
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
  private container: Container
  private config: SDKConfig

  private constructor(container: Container, config: SDKConfig) {
    this.container = container
    this.config = config
  }

  /**
   * Factory method to create SDK instance
   */
  static async create(config: SDKConfig = {}): Promise<ProjectManagerSDK> {
    const container = createContainer(config)
    return new ProjectManagerSDK(container, config)
  }

  /**
   * Ticket Management Operations
   */
  public readonly tickets = {
    /**
     * Create a new ticket
     */
    create: async (request: CreateTicketRequest): Promise<TicketResponse> => {
      const useCase = this.container.get<CreateTicket.UseCase>(TYPES.CreateTicketUseCase)

      const response = await useCase.execute({
        title: request.title,
        priority: request.priority,
        type: request.type,
        status: request.status,
        description: request.description,
      })
      return this.mapTicketResponseToSDKResponse(response)
    },

    /**
     * Get ticket by ID
     */
    getById: async (id: string): Promise<TicketResponse | null> => {
      const useCase = this.container.get<GetTicketById.UseCase>(TYPES.GetTicketByIdUseCase)
      const request = { id }

      const response = await useCase.execute(request)
      return response ? this.mapTicketResponseToSDKResponse(response) : null
    },

    /**
     * Update ticket content (title and description)
     */
    updateContent: async (request: UpdateTicketContentRequest): Promise<TicketResponse> => {
      const useCase = this.container.get<UpdateTicketContent.UseCase>(
        TYPES.UpdateTicketContentUseCase
      )
      const updateRequest = {
        id: request.id,
        updates: {
          title: request.title,
          description: request.description,
        },
      }

      const response = await useCase.execute(updateRequest)
      return this.mapTicketResponseToSDKResponse(response)
    },

    /**
     * Update ticket status
     */
    updateStatus: async (id: string, status: string): Promise<TicketResponse> => {
      const useCase = this.container.get<UpdateTicketStatus.UseCase>(
        TYPES.UpdateTicketStatusUseCase
      )
      const request = { id, newStatus: status }

      const response = await useCase.execute(request)
      return this.mapTicketResponseToSDKResponse(response)
    },

    /**
     * Delete ticket
     */
    delete: async (id: string): Promise<void> => {
      const useCase = this.container.get<DeleteTicket.UseCase>(TYPES.DeleteTicketUseCase)
      const request = { id }

      await useCase.execute(request)
    },

    /**
     * Search tickets
     */
    search: async (request: SearchTicketsRequest): Promise<TicketResponse[]> => {
      const useCase = this.container.get<SearchTickets.UseCase>(TYPES.SearchTicketsUseCase)

      const response = await useCase.execute({
        criteria: {
          search: request.query,
          status: request.status,
          priority: request.priority,
          type: request.type,
          searchIn: request.searchIn,
        },
      })
      return response.tickets.map((ticket: ApplicationLayerTicketResponse) =>
        this.mapTicketResponseToSDKResponse(ticket)
      )
    },
  }

  /**
   * Development Process Management Operations
   * Available only in development-like modes (development, testing, isolated)
   */
  public readonly development = {
    /**
     * Get the development process service
     * @returns Development process service if available in current mode
     * @throws Error if not available in current mode
     */
    getProcessService: (): DevelopmentProcessService => {
      const envService = this.container.get<EnvironmentDetectionService>(
        TYPES.EnvironmentDetectionService
      )
      const environment = envService.resolveEnvironment(this.config.environment)
      if (!isDevelopmentLike(environment)) {
        throw new Error(
          `Development process service is not available in '${environment}' environment. Available in: development, testing, isolated environments.`
        )
      }

      return this.container.get<DevelopmentProcessService>(TYPES.DevelopmentProcessService)
    },

    /**
     * Check if development process service is available in current environment
     * @returns true if development process service is available
     */
    isAvailable: (): boolean => {
      const envService = this.container.get<EnvironmentDetectionService>(
        TYPES.EnvironmentDetectionService
      )
      const environment = envService.resolveEnvironment(this.config.environment)
      return isDevelopmentLike(environment)
    },
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

/**
 * Convenience factory function for creating SDK instance
 */
export async function createProjectManagerSDK(config: SDKConfig = {}) {
  return ProjectManagerSDK.create(config)
}
