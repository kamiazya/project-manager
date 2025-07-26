import type { TicketResponse as AppTicketResponse } from '@project-manager/application'
import type { Container } from 'inversify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TYPES } from './internal/types.ts'
import {
  type CreateTicketRequest,
  createProjectManagerSDK,
  ProjectManagerSDK,
  type SearchTicketsRequest,
  type UpdateTicketContentRequest,
} from './project-manager-sdk.ts'

// Mock container
const mockContainer = {
  get: vi.fn(),
} as unknown as Container

// Mock use cases
const mockCreateTicketUseCase = {
  execute: vi.fn(),
}

const mockGetTicketByIdUseCase = {
  execute: vi.fn(),
}

const mockUpdateTicketContentUseCase = {
  execute: vi.fn(),
}

const mockUpdateTicketStatusUseCase = {
  execute: vi.fn(),
}

const mockDeleteTicketUseCase = {
  execute: vi.fn(),
}

const mockSearchTicketsUseCase = {
  execute: vi.fn(),
}

// Mock services
const mockEnvironmentDetectionService = {
  resolveEnvironment: vi.fn(),
}

const mockDevelopmentProcessService = {
  getProcessInfo: vi.fn(),
}

// Mock the createContainer function
vi.mock('./internal/container.ts', () => ({
  createContainer: vi.fn(() => mockContainer),
}))

describe('ProjectManagerSDK', () => {
  let sdk: ProjectManagerSDK
  let mockTicketResponse: AppTicketResponse

  beforeEach(async () => {
    vi.clearAllMocks()

    // Setup default mock responses
    mockTicketResponse = {
      id: 'ticket-123',
      title: 'Test Ticket',
      description: 'Test Description',
      status: 'pending',
      priority: 'high',
      type: 'feature',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    }

    // Configure container.get to return appropriate mocks
    vi.mocked(mockContainer.get).mockImplementation(type => {
      switch (type) {
        case TYPES.CreateTicketUseCase:
          return mockCreateTicketUseCase
        case TYPES.GetTicketByIdUseCase:
          return mockGetTicketByIdUseCase
        case TYPES.UpdateTicketContentUseCase:
          return mockUpdateTicketContentUseCase
        case TYPES.UpdateTicketStatusUseCase:
          return mockUpdateTicketStatusUseCase
        case TYPES.DeleteTicketUseCase:
          return mockDeleteTicketUseCase
        case TYPES.SearchTicketsUseCase:
          return mockSearchTicketsUseCase
        case TYPES.EnvironmentDetectionService:
          return mockEnvironmentDetectionService
        case TYPES.DevelopmentProcessService:
          return mockDevelopmentProcessService
        default:
          throw new Error(`Unknown type: ${String(type)}`)
      }
    })

    // Setup default environment
    mockEnvironmentDetectionService.resolveEnvironment.mockReturnValue('production')

    // Create SDK instance
    sdk = await ProjectManagerSDK.create()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Factory methods', () => {
    it('should create SDK instance with default config', async () => {
      const instance = await ProjectManagerSDK.create()
      expect(instance).toBeInstanceOf(ProjectManagerSDK)
    })

    it('should create SDK instance with custom config', async () => {
      const instance = await ProjectManagerSDK.create({ environment: 'testing' })
      expect(instance).toBeInstanceOf(ProjectManagerSDK)
    })

    it('should create SDK using convenience function', async () => {
      const instance = await createProjectManagerSDK()
      expect(instance).toBeInstanceOf(ProjectManagerSDK)
    })

    it('should create SDK with different environments', async () => {
      const environments = ['production', 'development', 'testing', 'in-memory', 'isolated', 'auto']

      for (const env of environments) {
        const instance = await ProjectManagerSDK.create({ environment: env as any })
        expect(instance).toBeInstanceOf(ProjectManagerSDK)
      }
    })
  })

  describe('tickets.create', () => {
    beforeEach(() => {
      mockCreateTicketUseCase.execute.mockResolvedValue(mockTicketResponse)
    })

    it('should create ticket with minimal data', async () => {
      // Arrange
      const request: CreateTicketRequest = {
        title: 'New Ticket',
      }

      // Act
      const result = await sdk.tickets.create(request)

      // Assert
      expect(mockCreateTicketUseCase.execute).toHaveBeenCalledWith({
        title: 'New Ticket',
        priority: undefined,
        type: undefined,
        status: undefined,
        description: undefined,
      })
      expect(result).toEqual({
        id: mockTicketResponse.id,
        title: mockTicketResponse.title,
        description: mockTicketResponse.description,
        status: mockTicketResponse.status,
        priority: mockTicketResponse.priority,
        type: mockTicketResponse.type,
        createdAt: mockTicketResponse.createdAt,
        updatedAt: mockTicketResponse.updatedAt,
      })
    })

    it('should create ticket with full data', async () => {
      // Arrange
      const request: CreateTicketRequest = {
        title: 'Full Ticket',
        description: 'Complete description',
        status: 'in_progress',
        priority: 'medium',
        type: 'bug',
      }

      // Act
      const result = await sdk.tickets.create(request)

      // Assert
      expect(mockCreateTicketUseCase.execute).toHaveBeenCalledWith({
        title: 'Full Ticket',
        description: 'Complete description',
        status: 'in_progress',
        priority: 'medium',
        type: 'bug',
      })
      expect(result).toBeDefined()
    })

    it('should handle errors from use case', async () => {
      // Arrange
      const error = new Error('Creation failed')
      mockCreateTicketUseCase.execute.mockRejectedValue(error)

      // Act & Assert
      await expect(sdk.tickets.create({ title: 'Test' })).rejects.toThrow('Creation failed')
    })

    describe('boundary value tests', () => {
      it('should handle empty title', async () => {
        await sdk.tickets.create({ title: '' })
        expect(mockCreateTicketUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ title: '' })
        )
      })

      it('should handle very long title', async () => {
        const longTitle = 'A'.repeat(1000)
        await sdk.tickets.create({ title: longTitle })
        expect(mockCreateTicketUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ title: longTitle })
        )
      })

      it('should handle special characters', async () => {
        const specialTitle = 'Title with @#$%^&*()[]{}|\\:";\'<>?,./'
        await sdk.tickets.create({ title: specialTitle })
        expect(mockCreateTicketUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ title: specialTitle })
        )
      })

      it('should handle Unicode characters', async () => {
        const unicodeTitle = 'テスト 🎉 ñørmål'
        await sdk.tickets.create({ title: unicodeTitle })
        expect(mockCreateTicketUseCase.execute).toHaveBeenCalledWith(
          expect.objectContaining({ title: unicodeTitle })
        )
      })
    })
  })

  describe('tickets.getById', () => {
    it('should get ticket by ID successfully', async () => {
      // Arrange
      mockGetTicketByIdUseCase.execute.mockResolvedValue(mockTicketResponse)

      // Act
      const result = await sdk.tickets.getById('ticket-123')

      // Assert
      expect(mockGetTicketByIdUseCase.execute).toHaveBeenCalledWith({ identifier: 'ticket-123' })
      expect(result).toEqual({
        id: mockTicketResponse.id,
        title: mockTicketResponse.title,
        description: mockTicketResponse.description,
        status: mockTicketResponse.status,
        priority: mockTicketResponse.priority,
        type: mockTicketResponse.type,
        createdAt: mockTicketResponse.createdAt,
        updatedAt: mockTicketResponse.updatedAt,
      })
    })

    it('should return null when ticket not found', async () => {
      // Arrange
      mockGetTicketByIdUseCase.execute.mockResolvedValue(null)

      // Act
      const result = await sdk.tickets.getById('nonexistent')

      // Assert
      expect(result).toBeNull()
    })

    it('should handle errors from use case', async () => {
      // Arrange
      const error = new Error('Database error')
      mockGetTicketByIdUseCase.execute.mockRejectedValue(error)

      // Act & Assert
      await expect(sdk.tickets.getById('ticket-123')).rejects.toThrow('Database error')
    })

    describe('boundary value tests', () => {
      it('should handle empty ID', async () => {
        mockGetTicketByIdUseCase.execute.mockResolvedValue(null)
        await sdk.tickets.getById('')
        expect(mockGetTicketByIdUseCase.execute).toHaveBeenCalledWith({ identifier: '' })
      })

      it('should handle very long ID', async () => {
        mockGetTicketByIdUseCase.execute.mockResolvedValue(null)
        const longId = 'id-'.repeat(100)
        await sdk.tickets.getById(longId)
        expect(mockGetTicketByIdUseCase.execute).toHaveBeenCalledWith({ identifier: longId })
      })

      it('should handle special characters in ID', async () => {
        mockGetTicketByIdUseCase.execute.mockResolvedValue(null)
        const specialId = 'id-@#$%^&*()'
        await sdk.tickets.getById(specialId)
        expect(mockGetTicketByIdUseCase.execute).toHaveBeenCalledWith({ identifier: specialId })
      })
    })
  })

  describe('tickets.updateContent', () => {
    beforeEach(() => {
      mockUpdateTicketContentUseCase.execute.mockResolvedValue(mockTicketResponse)
    })

    it('should update ticket content successfully', async () => {
      // Arrange
      const request: UpdateTicketContentRequest = {
        id: 'ticket-123',
        title: 'Updated Title',
        description: 'Updated Description',
      }

      // Act
      const result = await sdk.tickets.updateContent(request)

      // Assert
      expect(mockUpdateTicketContentUseCase.execute).toHaveBeenCalledWith({
        identifier: 'ticket-123',
        updates: {
          title: 'Updated Title',
          description: 'Updated Description',
        },
      })
      expect(result).toBeDefined()
    })

    it('should update only title', async () => {
      // Arrange
      const request: UpdateTicketContentRequest = {
        id: 'ticket-123',
        title: 'New Title Only',
      }

      // Act
      await sdk.tickets.updateContent(request)

      // Assert
      expect(mockUpdateTicketContentUseCase.execute).toHaveBeenCalledWith({
        identifier: 'ticket-123',
        updates: {
          title: 'New Title Only',
          description: undefined,
        },
      })
    })

    it('should update only description', async () => {
      // Arrange
      const request: UpdateTicketContentRequest = {
        id: 'ticket-123',
        description: 'New Description Only',
      }

      // Act
      await sdk.tickets.updateContent(request)

      // Assert
      expect(mockUpdateTicketContentUseCase.execute).toHaveBeenCalledWith({
        identifier: 'ticket-123',
        updates: {
          title: undefined,
          description: 'New Description Only',
        },
      })
    })

    it('should handle errors from use case', async () => {
      // Arrange
      const error = new Error('Update failed')
      mockUpdateTicketContentUseCase.execute.mockRejectedValue(error)

      // Act & Assert
      await expect(sdk.tickets.updateContent({ id: 'ticket-123', title: 'Test' })).rejects.toThrow(
        'Update failed'
      )
    })
  })

  describe('tickets.updateStatus', () => {
    beforeEach(() => {
      mockUpdateTicketStatusUseCase.execute.mockResolvedValue(mockTicketResponse)
    })

    it('should update ticket status successfully', async () => {
      // Arrange & Act
      const result = await sdk.tickets.updateStatus('ticket-123', 'completed')

      // Assert
      expect(mockUpdateTicketStatusUseCase.execute).toHaveBeenCalledWith({
        identifier: 'ticket-123',
        newStatus: 'completed',
      })
      expect(result).toBeDefined()
    })

    it('should handle various status values', async () => {
      const statuses = ['pending', 'in_progress', 'completed', 'archived']

      for (const status of statuses) {
        await sdk.tickets.updateStatus('ticket-123', status)
        expect(mockUpdateTicketStatusUseCase.execute).toHaveBeenCalledWith({
          identifier: 'ticket-123',
          newStatus: status,
        })
      }
    })

    it('should handle errors from use case', async () => {
      // Arrange
      const error = new Error('Invalid status transition')
      mockUpdateTicketStatusUseCase.execute.mockRejectedValue(error)

      // Act & Assert
      await expect(sdk.tickets.updateStatus('ticket-123', 'invalid')).rejects.toThrow(
        'Invalid status transition'
      )
    })
  })

  describe('tickets.delete', () => {
    it('should delete ticket successfully', async () => {
      // Arrange
      mockDeleteTicketUseCase.execute.mockResolvedValue(undefined)

      // Act
      await sdk.tickets.delete('ticket-123')

      // Assert
      expect(mockDeleteTicketUseCase.execute).toHaveBeenCalledWith({ identifier: 'ticket-123' })
    })

    it('should handle errors from use case', async () => {
      // Arrange
      const error = new Error('Deletion failed')
      mockDeleteTicketUseCase.execute.mockRejectedValue(error)

      // Act & Assert
      await expect(sdk.tickets.delete('ticket-123')).rejects.toThrow('Deletion failed')
    })

    describe('boundary value tests', () => {
      it('should handle empty ID', async () => {
        mockDeleteTicketUseCase.execute.mockResolvedValue(undefined)
        await sdk.tickets.delete('')
        expect(mockDeleteTicketUseCase.execute).toHaveBeenCalledWith({ identifier: '' })
      })

      it('should handle special characters in ID', async () => {
        mockDeleteTicketUseCase.execute.mockResolvedValue(undefined)
        const specialId = 'ticket-!@#$%'
        await sdk.tickets.delete(specialId)
        expect(mockDeleteTicketUseCase.execute).toHaveBeenCalledWith({ identifier: specialId })
      })
    })
  })

  describe('tickets.search', () => {
    beforeEach(() => {
      mockSearchTicketsUseCase.execute.mockResolvedValue({
        tickets: [mockTicketResponse],
        totalCount: 1,
      })
    })

    it('should search tickets with query', async () => {
      // Arrange
      const request: SearchTicketsRequest = {
        query: 'test query',
      }

      // Act
      const result = await sdk.tickets.search(request)

      // Assert
      expect(mockSearchTicketsUseCase.execute).toHaveBeenCalledWith({
        criteria: {
          search: 'test query',
          status: undefined,
          priority: undefined,
          type: undefined,
          searchIn: undefined,
        },
      })
      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe(mockTicketResponse.id)
    })

    it('should search with all criteria', async () => {
      // Arrange
      const request: SearchTicketsRequest = {
        query: 'bug fix',
        status: 'in_progress',
        priority: 'high',
        type: 'bug',
        searchIn: ['title', 'description'],
      }

      // Act
      await sdk.tickets.search(request)

      // Assert
      expect(mockSearchTicketsUseCase.execute).toHaveBeenCalledWith({
        criteria: {
          search: 'bug fix',
          status: 'in_progress',
          priority: 'high',
          type: 'bug',
          searchIn: ['title', 'description'],
        },
      })
    })

    it('should handle empty search results', async () => {
      // Arrange
      mockSearchTicketsUseCase.execute.mockResolvedValue({
        tickets: [],
        totalCount: 0,
      })

      // Act
      const result = await sdk.tickets.search({ query: 'nonexistent' })

      // Assert
      expect(result).toEqual([])
    })

    it('should handle multiple search results', async () => {
      // Arrange
      const ticket2 = { ...mockTicketResponse, id: 'ticket-456', title: 'Second Ticket' }
      mockSearchTicketsUseCase.execute.mockResolvedValue({
        tickets: [mockTicketResponse, ticket2],
        totalCount: 2,
      })

      // Act
      const result = await sdk.tickets.search({ query: 'test' })

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0]?.id).toBe('ticket-123')
      expect(result[1]?.id).toBe('ticket-456')
    })

    it('should handle errors from use case', async () => {
      // Arrange
      const error = new Error('Search failed')
      mockSearchTicketsUseCase.execute.mockRejectedValue(error)

      // Act & Assert
      await expect(sdk.tickets.search({ query: 'test' })).rejects.toThrow('Search failed')
    })
  })

  describe('environment operations', () => {
    it('should get current environment', () => {
      // Arrange
      mockEnvironmentDetectionService.resolveEnvironment.mockReturnValue('production')

      // Act
      const result = sdk.environment.getEnvironment()

      // Assert
      expect(result).toBe('production')
      expect(mockEnvironmentDetectionService.resolveEnvironment).toHaveBeenCalledWith(undefined)
    })

    it('should detect development-like environments', () => {
      // Test development-like environments
      const devLikeEnvs = ['development', 'testing', 'isolated']
      for (const env of devLikeEnvs) {
        mockEnvironmentDetectionService.resolveEnvironment.mockReturnValue(env)
        expect(sdk.environment.isDevelopmentLike()).toBe(true)
      }

      // Test non-development-like environments
      const prodLikeEnvs = ['production', 'in-memory']
      for (const env of prodLikeEnvs) {
        mockEnvironmentDetectionService.resolveEnvironment.mockReturnValue(env)
        expect(sdk.environment.isDevelopmentLike()).toBe(false)
      }
    })

    it('should respect custom environment from config', async () => {
      // Arrange
      const customSdk = await ProjectManagerSDK.create({ environment: 'testing' })

      // Act
      customSdk.environment.getEnvironment()

      // Assert
      expect(mockEnvironmentDetectionService.resolveEnvironment).toHaveBeenCalledWith('testing')
    })
  })

  describe('development operations', () => {
    it('should get development process service in development environment', () => {
      // Arrange
      mockEnvironmentDetectionService.resolveEnvironment.mockReturnValue('development')

      // Act
      const service = sdk.development.getProcessService()

      // Assert
      expect(service).toBe(mockDevelopmentProcessService)
    })

    it('should throw error in production environment', () => {
      // Arrange
      mockEnvironmentDetectionService.resolveEnvironment.mockReturnValue('production')

      // Act & Assert
      expect(() => sdk.development.getProcessService()).toThrow(
        "Development process service is not available in 'production' environment"
      )
    })

    it('should check availability correctly', () => {
      // Development-like environments
      mockEnvironmentDetectionService.resolveEnvironment.mockReturnValue('development')
      expect(sdk.development.isAvailable()).toBe(true)

      mockEnvironmentDetectionService.resolveEnvironment.mockReturnValue('testing')
      expect(sdk.development.isAvailable()).toBe(true)

      mockEnvironmentDetectionService.resolveEnvironment.mockReturnValue('isolated')
      expect(sdk.development.isAvailable()).toBe(true)

      // Non-development environments
      mockEnvironmentDetectionService.resolveEnvironment.mockReturnValue('production')
      expect(sdk.development.isAvailable()).toBe(false)

      mockEnvironmentDetectionService.resolveEnvironment.mockReturnValue('in-memory')
      expect(sdk.development.isAvailable()).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should handle container.get errors', async () => {
      // Arrange
      vi.mocked(mockContainer.get).mockImplementation(() => {
        throw new Error('Container error')
      })

      // Act & Assert
      await expect(sdk.tickets.create({ title: 'Test' })).rejects.toThrow('Container error')
    })

    it('should handle use case execution errors with details', async () => {
      // Arrange
      const detailedError = new Error('Validation failed: Title too short')
      mockCreateTicketUseCase.execute.mockRejectedValue(detailedError)

      // Act & Assert
      await expect(sdk.tickets.create({ title: 'T' })).rejects.toThrow(
        'Validation failed: Title too short'
      )
    })
  })

  describe('response mapping', () => {
    it('should correctly map all ticket fields', async () => {
      // Arrange
      const detailedResponse: AppTicketResponse = {
        id: 'detailed-123',
        title: 'Detailed Title',
        description: 'Detailed Description',
        status: 'in_progress',
        priority: 'medium',
        type: 'task',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T15:45:00.000Z',
      }
      mockGetTicketByIdUseCase.execute.mockResolvedValue(detailedResponse)

      // Act
      const result = await sdk.tickets.getById('detailed-123')

      // Assert
      expect(result).toEqual({
        id: 'detailed-123',
        title: 'Detailed Title',
        description: 'Detailed Description',
        status: 'in_progress',
        priority: 'medium',
        type: 'task',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T15:45:00.000Z',
      })
    })

    it('should handle undefined description', async () => {
      // Arrange
      const responseWithoutDesc: AppTicketResponse = {
        ...mockTicketResponse,
        description: undefined,
      }
      mockGetTicketByIdUseCase.execute.mockResolvedValue(responseWithoutDesc)

      // Act
      const result = await sdk.tickets.getById('ticket-123')

      // Assert
      expect(result?.description).toBeUndefined()
    })
  })
})
