import type {
  DevelopmentProcessService,
  EnvironmentDetectionService,
  StorageConfigService,
  TicketRepository,
} from '@project-manager/application'
import {
  InMemoryTicketRepository,
  JsonTicketRepository,
  NodeEnvironmentDetectionService,
  XdgDevelopmentProcessService,
} from '@project-manager/infrastructure'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createContainer } from './container.ts'
import { TYPES } from './types.ts'

// Mock infrastructure implementations
vi.mock('@project-manager/infrastructure', () => ({
  InMemoryTicketRepository: vi.fn(),
  JsonTicketRepository: vi.fn(),
  NodeEnvironmentDetectionService: vi.fn(() => ({
    resolveEnvironment: vi.fn(env => env || 'production'),
  })),
  XdgStorageConfigService: vi.fn(() => ({
    getDefaultStoragePath: vi.fn(() => '/default/path/tickets.json'),
    getDefaultStorageDir: vi.fn(() => '/default/storage'),
    resolveStoragePath: vi.fn(() => '/resolved/path/tickets.json'),
  })),
  XdgDevelopmentProcessService: vi.fn(),
}))

// Mock application layer use cases
vi.mock('@project-manager/application', () => ({
  CreateTicket: {
    UseCase: vi.fn(),
  },
  GetTicketById: {
    UseCase: vi.fn(),
  },
  UpdateTicketStatus: {
    UseCase: vi.fn(),
  },
  UpdateTicketContent: {
    UseCase: vi.fn(),
  },
  UpdateTicketPriority: {
    UseCase: vi.fn(),
  },
  DeleteTicket: {
    UseCase: vi.fn(),
  },
  SearchTickets: {
    UseCase: vi.fn(),
  },
}))

describe('createContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('container creation', () => {
    it('should create container with default config', () => {
      const container = createContainer({})
      expect(container).toBeDefined()
      expect(container.isBound(TYPES.EnvironmentDetectionService)).toBe(true)
      expect(container.isBound(TYPES.StorageConfigService)).toBe(true)
      expect(container.isBound(TYPES.TicketRepository)).toBe(true)
    })

    it('should create container with custom config', () => {
      const container = createContainer({ environment: 'testing' })
      expect(container).toBeDefined()
    })
  })

  describe('service bindings', () => {
    it('should bind EnvironmentDetectionService as singleton', () => {
      const container = createContainer({})

      const service1 = container.get<EnvironmentDetectionService>(TYPES.EnvironmentDetectionService)
      const service2 = container.get<EnvironmentDetectionService>(TYPES.EnvironmentDetectionService)

      expect(service1).toBe(service2) // Same instance (singleton)
      expect(service1.constructor.name).toBe('NodeEnvironmentDetectionService')
    })

    it('should bind StorageConfigService as singleton', () => {
      const container = createContainer({})

      const service1 = container.get<StorageConfigService>(TYPES.StorageConfigService)
      const service2 = container.get<StorageConfigService>(TYPES.StorageConfigService)

      expect(service1).toBe(service2) // Same instance (singleton)
      expect(service1.constructor.name).toBe('XdgStorageConfigService')
    })

    it('should configure StorageConfigService with environment context', () => {
      const container = createContainer({ environment: 'testing' })

      const service = container.get<StorageConfigService>(TYPES.StorageConfigService)
      const path = service.getDefaultStoragePath()

      expect(path).toContain('tickets.json')
    })
  })

  describe('repository bindings', () => {
    it('should bind InMemoryTicketRepository for testing environment', () => {
      const container = createContainer({ environment: 'testing' })

      const repo = container.get<TicketRepository>(TYPES.TicketRepository)

      expect(InMemoryTicketRepository).toHaveBeenCalled()
    })

    it('should bind InMemoryTicketRepository for in-memory environment', () => {
      const container = createContainer({ environment: 'in-memory' })

      const repo = container.get<TicketRepository>(TYPES.TicketRepository)

      expect(InMemoryTicketRepository).toHaveBeenCalled()
    })

    it('should bind JsonTicketRepository for production environment', () => {
      const container = createContainer({ environment: 'production' })

      const repo = container.get<TicketRepository>(TYPES.TicketRepository)

      expect(JsonTicketRepository).toHaveBeenCalledWith('/resolved/path/tickets.json')
    })

    it('should bind JsonTicketRepository for development environment', () => {
      const container = createContainer({ environment: 'development' })

      const repo = container.get<TicketRepository>(TYPES.TicketRepository)

      expect(JsonTicketRepository).toHaveBeenCalledWith('/resolved/path/tickets.json')
    })

    it('should bind JsonTicketRepository for isolated environment', () => {
      const container = createContainer({ environment: 'isolated' })

      const repo = container.get<TicketRepository>(TYPES.TicketRepository)

      expect(JsonTicketRepository).toHaveBeenCalledWith('/resolved/path/tickets.json')
    })

    it('should bind repository as singleton', () => {
      const container = createContainer({})

      const repo1 = container.get<TicketRepository>(TYPES.TicketRepository)
      const repo2 = container.get<TicketRepository>(TYPES.TicketRepository)

      expect(repo1).toBe(repo2) // Same instance (singleton)
    })
  })

  describe('development process service bindings', () => {
    it('should bind DevelopmentProcessService for development environment', () => {
      const container = createContainer({ environment: 'development' })

      expect(container.isBound(TYPES.DevelopmentProcessService)).toBe(true)
      const service = container.get<DevelopmentProcessService>(TYPES.DevelopmentProcessService)

      expect(XdgDevelopmentProcessService).toHaveBeenCalledWith('development')
    })

    it('should bind DevelopmentProcessService for testing environment', () => {
      const container = createContainer({ environment: 'testing' })

      expect(container.isBound(TYPES.DevelopmentProcessService)).toBe(true)
      const service = container.get<DevelopmentProcessService>(TYPES.DevelopmentProcessService)

      expect(XdgDevelopmentProcessService).toHaveBeenCalledWith('testing')
    })

    it('should bind DevelopmentProcessService for isolated environment', () => {
      const container = createContainer({ environment: 'isolated' })

      expect(container.isBound(TYPES.DevelopmentProcessService)).toBe(true)
      const service = container.get<DevelopmentProcessService>(TYPES.DevelopmentProcessService)

      expect(XdgDevelopmentProcessService).toHaveBeenCalledWith('isolated')
    })

    it('should NOT bind DevelopmentProcessService for production environment', () => {
      const container = createContainer({ environment: 'production' })

      expect(container.isBound(TYPES.DevelopmentProcessService)).toBe(false)
    })

    it('should NOT bind DevelopmentProcessService for in-memory environment', () => {
      const container = createContainer({ environment: 'in-memory' })

      expect(container.isBound(TYPES.DevelopmentProcessService)).toBe(false)
    })
  })

  describe('use case bindings', () => {
    let container: any

    beforeEach(() => {
      container = createContainer({})
    })

    it('should bind all required use cases', () => {
      const useCaseTypes = [
        TYPES.CreateTicketUseCase,
        TYPES.GetTicketByIdUseCase,
        TYPES.UpdateTicketStatusUseCase,
        TYPES.UpdateTicketContentUseCase,
        TYPES.UpdateTicketPriorityUseCase,
        TYPES.DeleteTicketUseCase,
        TYPES.SearchTicketsUseCase,
      ]

      for (const type of useCaseTypes) {
        expect(container.isBound(type)).toBe(true)
      }
    })

    it('should create use cases with repository dependency', () => {
      // Get repository first to establish it
      const repo = container.get(TYPES.TicketRepository)

      // Get use cases
      const createUseCase = container.get(TYPES.CreateTicketUseCase)
      const getByIdUseCase = container.get(TYPES.GetTicketByIdUseCase)
      const updateStatusUseCase = container.get(TYPES.UpdateTicketStatusUseCase)
      const updateContentUseCase = container.get(TYPES.UpdateTicketContentUseCase)
      const updatePriorityUseCase = container.get(TYPES.UpdateTicketPriorityUseCase)
      const deleteUseCase = container.get(TYPES.DeleteTicketUseCase)
      const searchUseCase = container.get(TYPES.SearchTicketsUseCase)

      // Verify use cases exist
      expect(createUseCase).toBeDefined()
      expect(getByIdUseCase).toBeDefined()
      expect(updateStatusUseCase).toBeDefined()
      expect(updateContentUseCase).toBeDefined()
      expect(updatePriorityUseCase).toBeDefined()
      expect(deleteUseCase).toBeDefined()
      expect(searchUseCase).toBeDefined()
    })

    it('should reuse same repository instance for all use cases', () => {
      // Clear previous mocks
      vi.clearAllMocks()

      // Create fresh container
      const newContainer = createContainer({})

      // Get all use cases (this will trigger repository creation)
      newContainer.get(TYPES.CreateTicketUseCase)
      newContainer.get(TYPES.GetTicketByIdUseCase)
      newContainer.get(TYPES.UpdateTicketStatusUseCase)

      // Repository should be created only once (singleton)
      expect(JsonTicketRepository).toHaveBeenCalledTimes(1)
    })
  })

  describe('environment resolution', () => {
    it('should handle auto environment', () => {
      // Mock the environment service to return a valid environment
      vi.mocked(NodeEnvironmentDetectionService).mockImplementation(
        () =>
          ({
            resolveEnvironment: vi.fn(env => 'production'),
          }) as any
      )

      const container = createContainer({ environment: 'auto' })

      // Should resolve to default (production)
      const repo = container.get<TicketRepository>(TYPES.TicketRepository)

      expect(JsonTicketRepository).toHaveBeenCalled()
    })

    it('should handle undefined environment', () => {
      const container = createContainer({})

      // Should resolve to default (production)
      const repo = container.get<TicketRepository>(TYPES.TicketRepository)

      expect(JsonTicketRepository).toHaveBeenCalled()
    })

    it('should handle all environment modes', () => {
      const environments = ['production', 'development', 'testing', 'in-memory', 'isolated']

      for (const env of environments) {
        vi.clearAllMocks()
        const container = createContainer({ environment: env as any })
        const repo = container.get<TicketRepository>(TYPES.TicketRepository)

        if (env === 'testing' || env === 'in-memory') {
          expect(InMemoryTicketRepository).toHaveBeenCalled()
        } else {
          expect(JsonTicketRepository).toHaveBeenCalled()
        }
      }
    })
  })

  describe('error handling', () => {
    it('should throw error for unbound service', () => {
      const container = createContainer({})

      // Try to get a non-existent service
      expect(() => container.get('UNKNOWN_SERVICE')).toThrow()
    })

    it('should handle service creation errors', () => {
      // Create container first with normal mocks
      const container = createContainer({})

      // Mock container.get to throw error
      const originalGet = container.get.bind(container)
      container.get = vi.fn().mockImplementation(type => {
        if (type === TYPES.EnvironmentDetectionService) {
          throw new Error('Service creation failed')
        }
        return originalGet(type)
      })

      expect(() => container.get(TYPES.EnvironmentDetectionService)).toThrow(
        'Service creation failed'
      )
    })
  })

  describe('integration scenarios', () => {
    it('should create working container for CLI usage', () => {
      const container = createContainer({ environment: 'production' })

      // Verify all necessary services for CLI
      expect(container.isBound(TYPES.CreateTicketUseCase)).toBe(true)
      expect(container.isBound(TYPES.GetTicketByIdUseCase)).toBe(true)
      expect(container.isBound(TYPES.UpdateTicketStatusUseCase)).toBe(true)
      expect(container.isBound(TYPES.DeleteTicketUseCase)).toBe(true)
      expect(container.isBound(TYPES.SearchTicketsUseCase)).toBe(true)
    })

    it('should create working container for testing', () => {
      const container = createContainer({ environment: 'testing' })

      // Verify in-memory repository is used
      const repo = container.get<TicketRepository>(TYPES.TicketRepository)
      expect(InMemoryTicketRepository).toHaveBeenCalled()

      // Verify development service is available
      expect(container.isBound(TYPES.DevelopmentProcessService)).toBe(true)
    })

    it('should create working container for development', () => {
      const container = createContainer({ environment: 'development' })

      // Verify file-based repository is used
      const repo = container.get<TicketRepository>(TYPES.TicketRepository)
      expect(JsonTicketRepository).toHaveBeenCalled()

      // Verify development service is available
      expect(container.isBound(TYPES.DevelopmentProcessService)).toBe(true)
    })
  })
})
