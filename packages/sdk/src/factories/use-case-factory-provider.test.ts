import type {
  CreateTicket,
  DeleteTicket,
  GetTicketById,
  SearchTickets,
  UpdateTicketContent,
  UpdateTicketPriority,
  UpdateTicketStatus,
  UpdateTicketTitle,
} from '@project-manager/application'
import { Container } from 'inversify'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TYPES } from '../internal/types.ts'
import { UseCaseFactoryProvider } from './use-case-factory-provider.ts'

// Mock use cases
const mockCreateTicketUseCase = { execute: vi.fn() }
const mockGetTicketByIdUseCase = { execute: vi.fn() }
const mockUpdateTicketStatusUseCase = { execute: vi.fn() }
const mockUpdateTicketContentUseCase = { execute: vi.fn() }
const mockUpdateTicketPriorityUseCase = { execute: vi.fn() }
const mockUpdateTicketTitleUseCase = { execute: vi.fn() }
const mockDeleteTicketUseCase = { execute: vi.fn() }
const mockSearchTicketsUseCase = { execute: vi.fn() }

// Mock container
const mockContainer = {
  get: vi.fn(),
} as unknown as Container

describe('UseCaseFactoryProvider', () => {
  let provider: UseCaseFactoryProvider

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup container mock to return appropriate use cases
    vi.mocked(mockContainer.get).mockImplementation(type => {
      switch (type) {
        case TYPES.CreateTicketUseCase:
          return mockCreateTicketUseCase
        case TYPES.GetTicketByIdUseCase:
          return mockGetTicketByIdUseCase
        case TYPES.UpdateTicketStatusUseCase:
          return mockUpdateTicketStatusUseCase
        case TYPES.UpdateTicketContentUseCase:
          return mockUpdateTicketContentUseCase
        case TYPES.UpdateTicketPriorityUseCase:
          return mockUpdateTicketPriorityUseCase
        case TYPES.UpdateTicketTitleUseCase:
          return mockUpdateTicketTitleUseCase
        case TYPES.DeleteTicketUseCase:
          return mockDeleteTicketUseCase
        case TYPES.SearchTicketsUseCase:
          return mockSearchTicketsUseCase
        default:
          throw new Error(`Unknown type: ${type}`)
      }
    })

    provider = new UseCaseFactoryProvider(mockContainer)
  })

  describe('constructor', () => {
    it('should create provider with container', () => {
      expect(provider).toBeInstanceOf(UseCaseFactoryProvider)
    })

    it('should throw error if container is null', () => {
      expect(() => new UseCaseFactoryProvider(null as any)).toThrow()
    })

    it('should throw error if container is undefined', () => {
      expect(() => new UseCaseFactoryProvider(undefined as any)).toThrow()
    })
  })

  describe('getCreateTicketUseCase', () => {
    it('should return CreateTicket use case from container', () => {
      const result = provider.getCreateTicketUseCase()

      expect(result).toBe(mockCreateTicketUseCase)
      expect(mockContainer.get).toHaveBeenCalledWith(TYPES.CreateTicketUseCase)
    })

    it('should cache the use case for subsequent calls', () => {
      const result1 = provider.getCreateTicketUseCase()
      const result2 = provider.getCreateTicketUseCase()

      expect(result1).toBe(result2)
      expect(mockContainer.get).toHaveBeenCalledTimes(1)
    })
  })

  describe('getGetTicketByIdUseCase', () => {
    it('should return GetTicketById use case from container', () => {
      const result = provider.getGetTicketByIdUseCase()

      expect(result).toBe(mockGetTicketByIdUseCase)
      expect(mockContainer.get).toHaveBeenCalledWith(TYPES.GetTicketByIdUseCase)
    })

    it('should cache the use case for subsequent calls', () => {
      const result1 = provider.getGetTicketByIdUseCase()
      const result2 = provider.getGetTicketByIdUseCase()

      expect(result1).toBe(result2)
      expect(mockContainer.get).toHaveBeenCalledTimes(1)
    })
  })

  describe('getUpdateTicketStatusUseCase', () => {
    it('should return UpdateTicketStatus use case from container', () => {
      const result = provider.getUpdateTicketStatusUseCase()

      expect(result).toBe(mockUpdateTicketStatusUseCase)
      expect(mockContainer.get).toHaveBeenCalledWith(TYPES.UpdateTicketStatusUseCase)
    })

    it('should cache the use case for subsequent calls', () => {
      const result1 = provider.getUpdateTicketStatusUseCase()
      const result2 = provider.getUpdateTicketStatusUseCase()

      expect(result1).toBe(result2)
      expect(mockContainer.get).toHaveBeenCalledTimes(1)
    })
  })

  describe('getUpdateTicketContentUseCase', () => {
    it('should return UpdateTicketContent use case from container', () => {
      const result = provider.getUpdateTicketContentUseCase()

      expect(result).toBe(mockUpdateTicketContentUseCase)
      expect(mockContainer.get).toHaveBeenCalledWith(TYPES.UpdateTicketContentUseCase)
    })

    it('should cache the use case for subsequent calls', () => {
      const result1 = provider.getUpdateTicketContentUseCase()
      const result2 = provider.getUpdateTicketContentUseCase()

      expect(result1).toBe(result2)
      expect(mockContainer.get).toHaveBeenCalledTimes(1)
    })
  })

  describe('getUpdateTicketPriorityUseCase', () => {
    it('should return UpdateTicketPriority use case from container', () => {
      const result = provider.getUpdateTicketPriorityUseCase()

      expect(result).toBe(mockUpdateTicketPriorityUseCase)
      expect(mockContainer.get).toHaveBeenCalledWith(TYPES.UpdateTicketPriorityUseCase)
    })

    it('should cache the use case for subsequent calls', () => {
      const result1 = provider.getUpdateTicketPriorityUseCase()
      const result2 = provider.getUpdateTicketPriorityUseCase()

      expect(result1).toBe(result2)
      expect(mockContainer.get).toHaveBeenCalledTimes(1)
    })
  })

  describe('getUpdateTicketTitleUseCase', () => {
    it('should return UpdateTicketTitle use case from container', () => {
      const result = provider.getUpdateTicketTitleUseCase()

      expect(result).toBe(mockUpdateTicketTitleUseCase)
      expect(mockContainer.get).toHaveBeenCalledWith(TYPES.UpdateTicketTitleUseCase)
    })

    it('should cache the use case for subsequent calls', () => {
      const result1 = provider.getUpdateTicketTitleUseCase()
      const result2 = provider.getUpdateTicketTitleUseCase()

      expect(result1).toBe(result2)
      expect(mockContainer.get).toHaveBeenCalledTimes(1)
    })
  })

  describe('getDeleteTicketUseCase', () => {
    it('should return DeleteTicket use case from container', () => {
      const result = provider.getDeleteTicketUseCase()

      expect(result).toBe(mockDeleteTicketUseCase)
      expect(mockContainer.get).toHaveBeenCalledWith(TYPES.DeleteTicketUseCase)
    })

    it('should cache the use case for subsequent calls', () => {
      const result1 = provider.getDeleteTicketUseCase()
      const result2 = provider.getDeleteTicketUseCase()

      expect(result1).toBe(result2)
      expect(mockContainer.get).toHaveBeenCalledTimes(1)
    })
  })

  describe('getSearchTicketsUseCase', () => {
    it('should return SearchTickets use case from container', () => {
      const result = provider.getSearchTicketsUseCase()

      expect(result).toBe(mockSearchTicketsUseCase)
      expect(mockContainer.get).toHaveBeenCalledWith(TYPES.SearchTicketsUseCase)
    })

    it('should cache the use case for subsequent calls', () => {
      const result1 = provider.getSearchTicketsUseCase()
      const result2 = provider.getSearchTicketsUseCase()

      expect(result1).toBe(result2)
      expect(mockContainer.get).toHaveBeenCalledTimes(1)
    })
  })

  describe('error handling', () => {
    it('should propagate container errors', () => {
      vi.mocked(mockContainer.get).mockImplementation(() => {
        throw new Error('Container error')
      })

      expect(() => provider.getCreateTicketUseCase()).toThrow('Container error')
    })

    it('should handle missing use case bindings', () => {
      vi.mocked(mockContainer.get).mockReturnValue(undefined)

      const result = provider.getCreateTicketUseCase()
      expect(result).toBeUndefined()
    })
  })

  describe('caching behavior', () => {
    it('should cache each use case independently', () => {
      // Get different use cases
      const createUseCase = provider.getCreateTicketUseCase()
      const getByIdUseCase = provider.getGetTicketByIdUseCase()
      const updateStatusUseCase = provider.getUpdateTicketStatusUseCase()

      // Get them again
      const createUseCase2 = provider.getCreateTicketUseCase()
      const getByIdUseCase2 = provider.getGetTicketByIdUseCase()
      const updateStatusUseCase2 = provider.getUpdateTicketStatusUseCase()

      // Verify same instances returned
      expect(createUseCase).toBe(createUseCase2)
      expect(getByIdUseCase).toBe(getByIdUseCase2)
      expect(updateStatusUseCase).toBe(updateStatusUseCase2)

      // Verify container was called only once per use case
      expect(mockContainer.get).toHaveBeenCalledTimes(3)
    })

    it('should not share cache between different provider instances', () => {
      const provider2 = new UseCaseFactoryProvider(mockContainer)

      const useCase1 = provider.getCreateTicketUseCase()
      const useCase2 = provider2.getCreateTicketUseCase()

      // Both should get the same use case from container
      expect(useCase1).toBe(useCase2)

      // But container should be called twice (once per provider)
      expect(mockContainer.get).toHaveBeenCalledTimes(2)
    })
  })

  describe('use case execution', () => {
    it('should return executable use cases', async () => {
      // Setup mock execution
      mockCreateTicketUseCase.execute.mockResolvedValue({ id: '123' })

      const useCase = provider.getCreateTicketUseCase()
      const result = await useCase.execute({ title: 'Test' })

      expect(result).toEqual({ id: '123' })
      expect(mockCreateTicketUseCase.execute).toHaveBeenCalledWith({ title: 'Test' })
    })
  })

  describe('type safety', () => {
    it('should return correctly typed use cases', () => {
      const createUseCase = provider.getCreateTicketUseCase()
      const getByIdUseCase = provider.getGetTicketByIdUseCase()
      const updateStatusUseCase = provider.getUpdateTicketStatusUseCase()
      const updateContentUseCase = provider.getUpdateTicketContentUseCase()
      const updatePriorityUseCase = provider.getUpdateTicketPriorityUseCase()
      const updateTitleUseCase = provider.getUpdateTicketTitleUseCase()
      const deleteUseCase = provider.getDeleteTicketUseCase()
      const searchUseCase = provider.getSearchTicketsUseCase()

      // TypeScript will verify these are the correct types
      expect(createUseCase).toHaveProperty('execute')
      expect(getByIdUseCase).toHaveProperty('execute')
      expect(updateStatusUseCase).toHaveProperty('execute')
      expect(updateContentUseCase).toHaveProperty('execute')
      expect(updatePriorityUseCase).toHaveProperty('execute')
      expect(updateTitleUseCase).toHaveProperty('execute')
      expect(deleteUseCase).toHaveProperty('execute')
      expect(searchUseCase).toHaveProperty('execute')
    })
  })
})
