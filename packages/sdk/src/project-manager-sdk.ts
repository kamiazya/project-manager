/**
 * ProjectManagerSDK - Facade pattern implementation
 *
 * This class provides a unified interface to all Project Manager functionality,
 * following the Facade pattern to simplify complex subsystem interactions.
 */

import {
  AddCustomAliasUseCase,
  type TicketResponse as ApplicationLayerTicketResponse,
  CreateTicket,
  DeleteTicket,
  type DevelopmentProcessService,
  type EnvironmentDetectionService,
  GetAuditLogs,
  GetLogs,
  GetTicketById,
  SearchTickets,
  UpdateTicketContent,
  UpdateTicketPriority,
  UpdateTicketStatus,
} from '@project-manager/application'
import { type EnvironmentMode, isDevelopmentLike } from '@project-manager/base'
import type { Container } from 'inversify'
import { SdkServiceUnavailableError } from './common/errors/sdk-errors.ts'
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

export interface GetLogsRequest {
  level?: 'debug' | 'info' | 'warn' | 'error'
  component?: string
  operation?: string
  traceId?: string
  startTime?: string
  endTime?: string
  limit?: number
  offset?: number
}

export interface GetAuditLogsRequest {
  operation?: 'create' | 'read' | 'update' | 'delete' | 'search'
  operationId?: string
  resourceType?: string
  entityId?: string
  actorType?: 'human' | 'ai' | 'system'
  actorId?: string
  source?: 'cli' | 'mcp' | 'api' | 'test' | 'scheduler'
  traceId?: string
  startTime?: string
  endTime?: string
  success?: boolean
  limit?: number
  offset?: number
}

export interface LogEntry {
  id: string
  timestamp: string
  level: string
  message: string
  component?: string
  operation?: string
  traceId?: string
  metadata?: Record<string, any>
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  operation: string
  operationId: string
  resourceType: string
  entityId?: string
  actor: {
    type: string
    id: string
    name: string
    coAuthor?: string
  }
  source: string
  traceId: string
  before?: any
  after?: any
  changes?: Array<{
    field: string
    oldValue: any
    newValue: any
  }>
  success: boolean
  errorMessage?: string
  duration?: number
}

export interface LogsResponse {
  logs: LogEntry[]
  totalCount: number
  hasMore: boolean
}

export interface AuditLogsResponse {
  auditLogs: AuditLogEntry[]
  totalCount: number
  hasMore: boolean
  summary: {
    successRate: number
    operationCounts: Record<string, number>
    actorTypeCounts: Record<string, number>
    sourceCounts: Record<string, number>
  }
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
  aliases?: {
    canonical?: string
    custom: readonly string[]
  }
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
      const request = { identifier: id }

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
        identifier: request.id,
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
      const request = { identifier: id, newStatus: status }

      const response = await useCase.execute(request)
      return this.mapTicketResponseToSDKResponse(response)
    },

    /**
     * Update ticket priority
     */
    updatePriority: async (id: string, priority: string): Promise<TicketResponse> => {
      const useCase = this.container.get<UpdateTicketPriority.UseCase>(
        TYPES.UpdateTicketPriorityUseCase
      )
      const request = { identifier: id, newPriority: priority }

      const response = await useCase.execute(request)
      return this.mapTicketResponseToSDKResponse(response)
    },

    /**
     * Delete ticket
     */
    delete: async (id: string): Promise<void> => {
      const useCase = this.container.get<DeleteTicket.UseCase>(TYPES.DeleteTicketUseCase)
      const request = { identifier: id }

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

    /**
     * Add a custom alias to a ticket
     */
    addAlias: async (ticketId: string, alias: string): Promise<void> => {
      const useCase = this.container.get<AddCustomAliasUseCase>(TYPES.AddCustomAliasUseCase)
      await useCase.execute({ ticketId, alias })
    },
  }

  /**
   * Environment Operations
   */
  public readonly environment = {
    /**
     * Get current environment mode
     */
    getEnvironment: () => {
      const envService = this.container.get<EnvironmentDetectionService>(
        TYPES.EnvironmentDetectionService
      )
      return envService.resolveEnvironment(this.config.environment)
    },

    /**
     * Check if current environment is development-like
     */
    isDevelopmentLike: () => {
      const environment = this.environment.getEnvironment()
      return isDevelopmentLike(environment)
    },
  }

  /**
   * Log Management Operations
   */
  public readonly logs = {
    /**
     * Get system logs with optional filtering
     */
    getLogs: async (request: GetLogsRequest): Promise<LogsResponse> => {
      const useCase = this.container.get<GetLogs.UseCase>(TYPES.GetLogsUseCase)

      const useCaseRequest: GetLogs.Request = {
        level: request.level,
        component: request.component,
        operation: request.operation,
        traceId: request.traceId,
        startTime: request.startTime,
        endTime: request.endTime,
        limit: request.limit,
        offset: request.offset,
      }

      const response = await useCase.execute(useCaseRequest)
      return this.mapLogsResponseToSDKResponse(response)
    },
  }

  /**
   * Audit Management Operations
   */
  public readonly audit = {
    /**
     * Get audit logs with optional filtering
     */
    getAuditLogs: async (request: GetAuditLogsRequest): Promise<AuditLogsResponse> => {
      const useCase = this.container.get<GetAuditLogs.UseCase>(TYPES.GetAuditLogsUseCase)

      const useCaseRequest: GetAuditLogs.Request = {
        operation: request.operation,
        operationId: request.operationId,
        resourceType: request.resourceType,
        entityId: request.entityId,
        actorType: request.actorType,
        actorId: request.actorId,
        source: request.source,
        traceId: request.traceId,
        startTime: request.startTime,
        endTime: request.endTime,
        success: request.success,
        limit: request.limit,
        offset: request.offset,
      }

      const response = await useCase.execute(useCaseRequest)
      return this.mapAuditLogsResponseToSDKResponse(response)
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
        throw new SdkServiceUnavailableError('Development process service', environment, [
          'development',
          'testing',
          'isolated',
        ])
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
      aliases: ticketResponse.aliases,
    }
  }

  /**
   * Helper method to map GetLogs response from Application layer to SDK Response DTO
   */
  private mapLogsResponseToSDKResponse(response: GetLogs.Response): LogsResponse {
    return {
      logs: response.logs.map(log => ({
        id: log.id,
        timestamp:
          typeof log.timestamp === 'string' ? log.timestamp : (log.timestamp as Date).toISOString(),
        level: log.level,
        message: log.message,
        component: log.component,
        operation: log.operation,
        traceId: log.traceId,
        metadata: log.metadata,
      })),
      totalCount: response.totalCount,
      hasMore: response.hasMore,
    }
  }

  /**
   * Helper method to map GetAuditLogs response from Application layer to SDK Response DTO
   */
  private mapAuditLogsResponseToSDKResponse(response: GetAuditLogs.Response): AuditLogsResponse {
    return {
      auditLogs: response.auditLogs.map(log => ({
        id: log.id,
        timestamp:
          typeof log.timestamp === 'string' ? log.timestamp : (log.timestamp as Date).toISOString(),
        operation: log.operation,
        operationId: log.operationId,
        resourceType: log.resourceType,
        entityId: log.entityId,
        actor: {
          type: log.actor.type,
          id: log.actor.id,
          name: log.actor.name,
          coAuthor: log.actor.coAuthor,
        },
        source: log.source,
        traceId: log.traceId,
        before: log.before,
        after: log.after,
        changes: log.changes,
        success: log.success,
        errorMessage: log.errorMessage,
        duration: log.duration,
      })),
      totalCount: response.totalCount,
      hasMore: response.hasMore,
      summary: response.summary,
    }
  }

  /**
   * Shutdown the SDK and cleanup resources
   */
  async shutdown(): Promise<void> {
    try {
      // Import the global logger factory and shut it down
      const { getGlobalLoggerFactory } = await import('./logging/logger-factory.ts')
      const loggerFactory = getGlobalLoggerFactory()
      if (loggerFactory && typeof loggerFactory.shutdown === 'function') {
        await loggerFactory.shutdown()
      }
    } catch (error) {
      // Log error but don't throw to prevent hanging
      console.error('[SDK] Error during shutdown:', error)
    }
  }
}

/**
 * Convenience factory function for creating SDK instance
 */
export async function createProjectManagerSDK(config: SDKConfig = {}) {
  return ProjectManagerSDK.create(config)
}
