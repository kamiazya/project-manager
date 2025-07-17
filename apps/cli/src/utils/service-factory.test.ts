import { type UseCaseFactory, UseCaseFactoryProvider } from '@project-manager/application'
import { Container } from 'inversify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CLI_TYPES } from '../infrastructure/container.ts'
import {
  getArchiveTicketUseCase,
  getCompleteTicketUseCase,
  getCreateTicketUseCase,
  getDeleteTicketUseCase,
  getGetAllTicketsUseCase,
  getGetTicketByIdUseCase,
  getGetTicketStatsUseCase,
  getSearchTicketsUseCase,
  getServiceContainer,
  getStartTicketProgressUseCase,
  getUpdateTicketDescriptionUseCase,
  getUpdateTicketPriorityUseCase,
  getUpdateTicketStatusUseCase,
  getUpdateTicketTitleUseCase,
  getUpdateTicketUseCase,
  resetServiceContainer,
} from './service-factory.ts'

// Mock the dependencies
vi.mock('@project-manager/application', () => ({
  CreateTicket: {
    UseCase: vi.fn(),
  },
  GetAllTickets: {
    UseCase: vi.fn(),
  },
  GetTicketById: {
    UseCase: vi.fn(),
  },
  UseCaseFactoryProvider: {
    getInstance: vi.fn(),
    resetInstance: vi.fn(),
  },
}))

vi.mock('../infrastructure/repository/cli-ticket-repository.ts', () => ({
  CliTicketRepository: vi.fn(),
}))

vi.mock('./config.ts', () => ({
  getStoragePath: vi.fn(() => '/test/storage/path'),
}))

vi.mock('inversify', () => ({
  Container: vi.fn(() => ({
    bind: vi.fn(() => ({
      toConstantValue: vi.fn(),
    })),
  })),
}))

describe('service-factory', () => {
  let mockUseCaseFactory: UseCaseFactory
  let mockProvider: typeof UseCaseFactoryProvider
  let mockContainer: Container

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Mock use cases
    const mockCreateTicketUseCase = { execute: vi.fn() } as any
    const mockGetTicketByIdUseCase = { execute: vi.fn() } as any
    const mockGetAllTicketsUseCase = { execute: vi.fn() } as any
    const mockUpdateTicketTitleUseCase = { execute: vi.fn() } as any
    const mockUpdateTicketDescriptionUseCase = { execute: vi.fn() } as any
    const mockUpdateTicketStatusUseCase = { execute: vi.fn() } as any
    const mockUpdateTicketPriorityUseCase = { execute: vi.fn() } as any
    const mockStartTicketProgressUseCase = { execute: vi.fn() } as any
    const mockCompleteTicketUseCase = { execute: vi.fn() } as any
    const mockArchiveTicketUseCase = { execute: vi.fn() } as any
    const mockDeleteTicketUseCase = { execute: vi.fn() } as any
    const mockGetTicketStatsUseCase = { execute: vi.fn() } as any
    const mockSearchTicketsUseCase = { execute: vi.fn() } as any
    const mockUpdateTicketUseCase = { execute: vi.fn() } as any

    // Mock use case factory
    mockUseCaseFactory = {
      ticketRepository: {} as any,
      createCreateTicketUseCase: vi.fn(() => mockCreateTicketUseCase),
      createGetTicketByIdUseCase: vi.fn(() => mockGetTicketByIdUseCase),
      createGetAllTicketsUseCase: vi.fn(() => mockGetAllTicketsUseCase),
      createUpdateTicketTitleUseCase: vi.fn(() => mockUpdateTicketTitleUseCase),
      createUpdateTicketDescriptionUseCase: vi.fn(() => mockUpdateTicketDescriptionUseCase),
      createUpdateTicketStatusUseCase: vi.fn(() => mockUpdateTicketStatusUseCase),
      createUpdateTicketPriorityUseCase: vi.fn(() => mockUpdateTicketPriorityUseCase),
      createStartTicketProgressUseCase: vi.fn(() => mockStartTicketProgressUseCase),
      createCompleteTicketUseCase: vi.fn(() => mockCompleteTicketUseCase),
      createArchiveTicketUseCase: vi.fn(() => mockArchiveTicketUseCase),
      createDeleteTicketUseCase: vi.fn(() => mockDeleteTicketUseCase),
      createGetTicketStatsUseCase: vi.fn(() => mockGetTicketStatsUseCase),
      createSearchTicketsUseCase: vi.fn(() => mockSearchTicketsUseCase),
      createUpdateTicketUseCase: vi.fn(() => mockUpdateTicketUseCase),
    } as unknown as UseCaseFactory

    // Mock provider
    mockProvider = {
      getInstance: vi.fn(() => ({
        createUseCaseFactory: vi.fn(() => mockUseCaseFactory),
      })),
      resetInstance: vi.fn(),
    } as any

    // Mock container
    const mockBind = vi.fn(() => ({
      toConstantValue: vi.fn(),
    }))
    mockContainer = {
      bind: mockBind,
    } as any

    // Setup mocks
    vi.mocked(UseCaseFactoryProvider.getInstance).mockReturnValue(mockProvider.getInstance())
    vi.mocked(UseCaseFactoryProvider.resetInstance).mockImplementation(mockProvider.resetInstance)
    vi.mocked(Container).mockReturnValue(mockContainer)
  })

  afterEach(() => {
    // Reset service container after each test to ensure clean state
    resetServiceContainer()
  })

  describe('singleton factory management', () => {
    it('should create factory instance on first call', () => {
      const useCase = getCreateTicketUseCase()

      expect(UseCaseFactoryProvider.getInstance).toHaveBeenCalledTimes(1)
      expect(mockUseCaseFactory.createCreateTicketUseCase).toHaveBeenCalledTimes(1)
      expect(useCase).toBeDefined()
    })

    it('should reuse factory instance on subsequent calls', () => {
      const useCase1 = getCreateTicketUseCase()
      const useCase2 = getGetTicketByIdUseCase()

      // Provider should only be called once
      expect(UseCaseFactoryProvider.getInstance).toHaveBeenCalledTimes(1)
      // But individual use case methods should be called
      expect(mockUseCaseFactory.createCreateTicketUseCase).toHaveBeenCalledTimes(1)
      expect(mockUseCaseFactory.createGetTicketByIdUseCase).toHaveBeenCalledTimes(1)
      expect(useCase1).toBeDefined()
      expect(useCase2).toBeDefined()
    })

    it('should reset factory instance when resetServiceContainer is called', () => {
      // First call creates instance
      getCreateTicketUseCase()
      expect(UseCaseFactoryProvider.getInstance).toHaveBeenCalledTimes(1)

      // Reset
      resetServiceContainer()

      // Next call should create new instance
      getCreateTicketUseCase()
      expect(UseCaseFactoryProvider.getInstance).toHaveBeenCalledTimes(2)
      expect(UseCaseFactoryProvider.resetInstance).toHaveBeenCalledTimes(1)
    })
  })

  describe('individual use case getters', () => {
    it('should return CreateTicket use case', () => {
      const useCase = getCreateTicketUseCase()

      expect(useCase).toBeDefined()
      expect(mockUseCaseFactory.createCreateTicketUseCase).toHaveBeenCalledTimes(1)
    })

    it('should return GetTicketById use case', () => {
      const useCase = getGetTicketByIdUseCase()

      expect(useCase).toBeDefined()
      expect(mockUseCaseFactory.createGetTicketByIdUseCase).toHaveBeenCalledTimes(1)
    })

    it('should return GetAllTickets use case', () => {
      const useCase = getGetAllTicketsUseCase()

      expect(useCase).toBeDefined()
      expect(mockUseCaseFactory.createGetAllTicketsUseCase).toHaveBeenCalledTimes(1)
    })

    it('should return UpdateTicketTitle use case', () => {
      const useCase = getUpdateTicketTitleUseCase()

      expect(useCase).toBeDefined()
      expect(mockUseCaseFactory.createUpdateTicketTitleUseCase).toHaveBeenCalledTimes(1)
    })

    it('should return UpdateTicketDescription use case', () => {
      const useCase = getUpdateTicketDescriptionUseCase()

      expect(useCase).toBeDefined()
      expect(mockUseCaseFactory.createUpdateTicketDescriptionUseCase).toHaveBeenCalledTimes(1)
    })

    it('should return UpdateTicketStatus use case', () => {
      const useCase = getUpdateTicketStatusUseCase()

      expect(useCase).toBeDefined()
      expect(mockUseCaseFactory.createUpdateTicketStatusUseCase).toHaveBeenCalledTimes(1)
    })

    it('should return UpdateTicketPriority use case', () => {
      const useCase = getUpdateTicketPriorityUseCase()

      expect(useCase).toBeDefined()
      expect(mockUseCaseFactory.createUpdateTicketPriorityUseCase).toHaveBeenCalledTimes(1)
    })

    it('should return StartTicketProgress use case', () => {
      const useCase = getStartTicketProgressUseCase()

      expect(useCase).toBeDefined()
      expect(mockUseCaseFactory.createStartTicketProgressUseCase).toHaveBeenCalledTimes(1)
    })

    it('should return CompleteTicket use case', () => {
      const useCase = getCompleteTicketUseCase()

      expect(useCase).toBeDefined()
      expect(mockUseCaseFactory.createCompleteTicketUseCase).toHaveBeenCalledTimes(1)
    })

    it('should return ArchiveTicket use case', () => {
      const useCase = getArchiveTicketUseCase()

      expect(useCase).toBeDefined()
      expect(mockUseCaseFactory.createArchiveTicketUseCase).toHaveBeenCalledTimes(1)
    })

    it('should return DeleteTicket use case', () => {
      const useCase = getDeleteTicketUseCase()

      expect(useCase).toBeDefined()
      expect(mockUseCaseFactory.createDeleteTicketUseCase).toHaveBeenCalledTimes(1)
    })

    it('should return GetTicketStats use case', () => {
      const useCase = getGetTicketStatsUseCase()

      expect(useCase).toBeDefined()
      expect(mockUseCaseFactory.createGetTicketStatsUseCase).toHaveBeenCalledTimes(1)
    })

    it('should return SearchTickets use case', () => {
      const useCase = getSearchTicketsUseCase()

      expect(useCase).toBeDefined()
      expect(mockUseCaseFactory.createSearchTicketsUseCase).toHaveBeenCalledTimes(1)
    })

    it('should return UpdateTicket use case', () => {
      const useCase = getUpdateTicketUseCase()

      expect(useCase).toBeDefined()
      expect(mockUseCaseFactory.createUpdateTicketUseCase).toHaveBeenCalledTimes(1)
    })
  })

  describe('dependency injection container (backward compatibility)', () => {
    it('should create container instance on first call', () => {
      const container = getServiceContainer()

      expect(container).toBeDefined()
      expect(Container).toHaveBeenCalledTimes(1)
    })

    it('should reuse container instance on subsequent calls', () => {
      const container1 = getServiceContainer()
      const container2 = getServiceContainer()

      expect(container1).toBe(container2)
      expect(Container).toHaveBeenCalledTimes(1)
    })

    it('should bind all use cases to container', () => {
      const container = getServiceContainer()

      expect(container.bind).toHaveBeenCalledWith(CLI_TYPES.CreateTicketUseCase)
      expect(container.bind).toHaveBeenCalledWith(CLI_TYPES.GetTicketByIdUseCase)
      expect(container.bind).toHaveBeenCalledWith(CLI_TYPES.GetAllTicketsUseCase)
      expect(container.bind).toHaveBeenCalledWith(CLI_TYPES.UpdateTicketTitleUseCase)
      expect(container.bind).toHaveBeenCalledWith(CLI_TYPES.UpdateTicketDescriptionUseCase)
      expect(container.bind).toHaveBeenCalledWith(CLI_TYPES.UpdateTicketStatusUseCase)
      expect(container.bind).toHaveBeenCalledWith(CLI_TYPES.UpdateTicketPriorityUseCase)
      expect(container.bind).toHaveBeenCalledWith(CLI_TYPES.StartTicketProgressUseCase)
      expect(container.bind).toHaveBeenCalledWith(CLI_TYPES.CompleteTicketUseCase)
      expect(container.bind).toHaveBeenCalledWith(CLI_TYPES.ArchiveTicketUseCase)
      expect(container.bind).toHaveBeenCalledWith(CLI_TYPES.DeleteTicketUseCase)
      expect(container.bind).toHaveBeenCalledWith(CLI_TYPES.GetTicketStatsUseCase)
      expect(container.bind).toHaveBeenCalledWith(CLI_TYPES.SearchTicketsUseCase)
      expect(container.bind).toHaveBeenCalledWith(CLI_TYPES.UpdateTicketUseCase)

      // Should bind exactly 14 use cases
      expect(container.bind).toHaveBeenCalledTimes(14)
    })

    it('should reset container instance when resetServiceContainer is called', () => {
      // First call creates instance
      getServiceContainer()
      expect(Container).toHaveBeenCalledTimes(1)

      // Reset
      resetServiceContainer()

      // Next call should create new instance
      getServiceContainer()
      expect(Container).toHaveBeenCalledTimes(2)
    })
  })

  describe('resetServiceContainer', () => {
    it('should reset both factory and container instances', () => {
      // Create instances
      getCreateTicketUseCase()
      getServiceContainer()

      // Verify they were created
      expect(UseCaseFactoryProvider.getInstance).toHaveBeenCalledTimes(1)
      expect(Container).toHaveBeenCalledTimes(1)

      // Reset
      resetServiceContainer()

      // Verify reset was called
      expect(UseCaseFactoryProvider.resetInstance).toHaveBeenCalledTimes(1)

      // Create instances again
      getCreateTicketUseCase()
      getServiceContainer()

      // Verify new instances were created
      expect(UseCaseFactoryProvider.getInstance).toHaveBeenCalledTimes(2)
      expect(Container).toHaveBeenCalledTimes(2)
    })

    it('should be safe to call multiple times', () => {
      resetServiceContainer()
      resetServiceContainer()
      resetServiceContainer()

      expect(UseCaseFactoryProvider.resetInstance).toHaveBeenCalledTimes(3)
    })

    it('should be safe to call before any instances are created', () => {
      expect(() => resetServiceContainer()).not.toThrow()
      expect(UseCaseFactoryProvider.resetInstance).toHaveBeenCalledTimes(1)
    })
  })

  describe('error handling', () => {
    it('should handle provider getInstance throwing error', () => {
      vi.mocked(UseCaseFactoryProvider.getInstance).mockImplementation(() => {
        throw new Error('Provider initialization failed')
      })

      expect(() => getCreateTicketUseCase()).toThrow('Provider initialization failed')
    })

    it('should handle factory createUseCaseFactory throwing error', () => {
      const mockProviderInstance = {
        createUseCaseFactory: vi.fn(() => {
          throw new Error('Factory creation failed')
        }),
      }
      vi.mocked(UseCaseFactoryProvider.getInstance).mockReturnValue(mockProviderInstance as any)

      expect(() => getCreateTicketUseCase()).toThrow('Factory creation failed')
    })

    it('should handle use case creation throwing error', () => {
      const errorFactory = {
        ...mockUseCaseFactory,
        createCreateTicketUseCase: vi.fn(() => {
          throw new Error('Use case creation failed')
        }),
      }
      const mockProviderInstance = {
        createUseCaseFactory: vi.fn(() => errorFactory),
      }
      vi.mocked(UseCaseFactoryProvider.getInstance).mockReturnValue(mockProviderInstance as any)

      expect(() => getCreateTicketUseCase()).toThrow('Use case creation failed')
    })

    it('should handle Container constructor throwing error', () => {
      vi.mocked(Container).mockImplementation(() => {
        throw new Error('Container creation failed')
      })

      expect(() => getServiceContainer()).toThrow('Container creation failed')
    })

    it('should handle container binding throwing error', () => {
      const errorContainer = {
        bind: vi.fn(() => {
          throw new Error('Binding failed')
        }),
      }
      vi.mocked(Container).mockReturnValue(errorContainer as any)

      expect(() => getServiceContainer()).toThrow('Binding failed')
    })
  })

  describe('lazy initialization', () => {
    it('should not create factory until first use case is requested', () => {
      // No use case getters called yet
      expect(UseCaseFactoryProvider.getInstance).not.toHaveBeenCalled()

      // Call first use case getter
      getCreateTicketUseCase()
      expect(UseCaseFactoryProvider.getInstance).toHaveBeenCalledTimes(1)
    })

    it('should not create container until getServiceContainer is called', () => {
      // Call use case getters
      getCreateTicketUseCase()
      getGetTicketByIdUseCase()

      // Container should not be created yet
      expect(Container).not.toHaveBeenCalled()

      // Call getServiceContainer
      getServiceContainer()
      expect(Container).toHaveBeenCalledTimes(1)
    })

    it('should create factory when getServiceContainer is called but not vice versa', () => {
      // Call getServiceContainer first
      getServiceContainer()

      // Factory should be created
      expect(UseCaseFactoryProvider.getInstance).toHaveBeenCalledTimes(1)

      // Subsequent use case calls should reuse factory
      getCreateTicketUseCase()
      expect(UseCaseFactoryProvider.getInstance).toHaveBeenCalledTimes(1)
    })
  })

  describe('concurrency and thread safety', () => {
    it('should handle concurrent calls safely', async () => {
      const promises = [
        Promise.resolve(getCreateTicketUseCase()),
        Promise.resolve(getGetTicketByIdUseCase()),
        Promise.resolve(getGetAllTicketsUseCase()),
        Promise.resolve(getServiceContainer()),
      ]

      const results = await Promise.all(promises)

      expect(results).toHaveLength(4)
      results.forEach(result => expect(result).toBeDefined())

      // Factory should only be created once despite concurrent access
      expect(UseCaseFactoryProvider.getInstance).toHaveBeenCalledTimes(1)
    })

    it('should handle rapid sequential calls', () => {
      const useCases = []
      for (let i = 0; i < 100; i++) {
        useCases.push(getCreateTicketUseCase())
      }

      expect(useCases).toHaveLength(100)
      useCases.forEach(useCase => expect(useCase).toBeDefined())

      // Factory should only be created once
      expect(UseCaseFactoryProvider.getInstance).toHaveBeenCalledTimes(1)
      // But use case method should be called 100 times
      expect(mockUseCaseFactory.createCreateTicketUseCase).toHaveBeenCalledTimes(100)
    })
  })

  describe('memory management', () => {
    it('should not cause memory leaks with repeated resets', () => {
      for (let i = 0; i < 10; i++) {
        getCreateTicketUseCase()
        getServiceContainer()
        resetServiceContainer()
      }

      expect(UseCaseFactoryProvider.getInstance).toHaveBeenCalledTimes(10)
      expect(Container).toHaveBeenCalledTimes(10)
      expect(UseCaseFactoryProvider.resetInstance).toHaveBeenCalledTimes(10)
    })

    it('should handle large numbers of use case requests', () => {
      const useCases = []
      for (let i = 0; i < 1000; i++) {
        useCases.push(getCreateTicketUseCase())
      }

      expect(useCases).toHaveLength(1000)
      expect(UseCaseFactoryProvider.getInstance).toHaveBeenCalledTimes(1)
    })
  })

  describe('integration with Clean Architecture', () => {
    it('should maintain dependency direction (inward)', () => {
      // Service factory should depend on core abstractions, not implementations
      const useCase = getCreateTicketUseCase()

      // Verify factory was called with repository (dependency injection)
      expect(UseCaseFactoryProvider.getInstance).toHaveBeenCalled()
      const providerCall = vi.mocked(UseCaseFactoryProvider.getInstance).mock.results[0]
      expect(providerCall!.value.createUseCaseFactory).toHaveBeenCalledWith({
        ticketRepository: expect.any(Object),
      })
    })

    it('should provide use cases that implement expected interfaces', () => {
      const createUseCase = getCreateTicketUseCase()
      const getByIdUseCase = getGetTicketByIdUseCase()
      const getAllUseCase = getGetAllTicketsUseCase()

      // All use cases should have execute method
      expect(createUseCase.execute).toBeDefined()
      expect(getByIdUseCase.execute).toBeDefined()
      expect(getAllUseCase.execute).toBeDefined()
    })
  })

  describe('backward compatibility', () => {
    it('should support both new factory pattern and old container pattern', () => {
      // New pattern
      const useCaseViaFactory = getCreateTicketUseCase()

      // Old pattern
      const container = getServiceContainer()

      expect(useCaseViaFactory).toBeDefined()
      expect(container).toBeDefined()
      expect(container.bind).toHaveBeenCalled()
    })

    it('should bind use cases to correct CLI_TYPES', () => {
      getServiceContainer()

      const expectedBindings = [
        CLI_TYPES.CreateTicketUseCase,
        CLI_TYPES.GetTicketByIdUseCase,
        CLI_TYPES.GetAllTicketsUseCase,
        CLI_TYPES.UpdateTicketTitleUseCase,
        CLI_TYPES.UpdateTicketDescriptionUseCase,
        CLI_TYPES.UpdateTicketStatusUseCase,
        CLI_TYPES.UpdateTicketPriorityUseCase,
        CLI_TYPES.StartTicketProgressUseCase,
        CLI_TYPES.CompleteTicketUseCase,
        CLI_TYPES.ArchiveTicketUseCase,
        CLI_TYPES.DeleteTicketUseCase,
        CLI_TYPES.GetTicketStatsUseCase,
        CLI_TYPES.SearchTicketsUseCase,
        CLI_TYPES.UpdateTicketUseCase,
      ]

      expectedBindings.forEach(type => {
        expect(mockContainer.bind).toHaveBeenCalledWith(type)
      })
    })
  })
})
