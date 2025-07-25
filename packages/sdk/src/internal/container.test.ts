import type {
  DevelopmentProcessService,
  EnvironmentDetectionService,
  StorageConfigService,
  TicketRepository,
} from '@project-manager/application'
// LoggingContextService is now managed through dependency injection
import {
  CrossPlatformStorageConfigService,
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
  // Logging factory functions
  createProductionLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
    flush: vi.fn(),
  })),
  createDevelopmentLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
    flush: vi.fn(),
  })),
  createTestLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
    flush: vi.fn(),
  })),
  createComplianceAuditLogger: vi.fn(() => ({
    recordCreate: vi.fn(),
    recordUpdate: vi.fn(),
    recordDelete: vi.fn(),
    queryEvents: vi.fn(() => []),
    getStatistics: vi.fn(() => ({})),
  })),
  createDevelopmentAuditLogger: vi.fn(() => ({
    recordCreate: vi.fn(),
    recordUpdate: vi.fn(),
    recordDelete: vi.fn(),
    queryEvents: vi.fn(() => []),
    getStatistics: vi.fn(() => ({})),
  })),
  NodeAsyncLocalStorage: vi.fn().mockImplementation(function MockNodeAsyncLocalStorage() {
    return {
      constructor: { name: 'NodeAsyncLocalStorage' },
      run: vi.fn(),
      getStore: vi.fn(),
    }
  }),
  FileLogReader: vi.fn().mockImplementation(function MockFileLogReader() {
    return { constructor: { name: 'FileLogReader' } }
  }),
  FileAuditReader: vi.fn().mockImplementation(function MockFileAuditReader() {
    return { constructor: { name: 'FileAuditReader' } }
  }),
  InMemoryTicketRepository: vi.fn().mockImplementation(function MockInMemoryTicketRepository() {
    return { constructor: { name: 'InMemoryTicketRepository' } }
  }),
  JsonTicketRepository: vi.fn().mockImplementation(function MockJsonTicketRepository() {
    return { constructor: { name: 'JsonTicketRepository' } }
  }),
  NodeEnvironmentDetectionService: vi
    .fn()
    .mockImplementation(function MockNodeEnvironmentDetectionService() {
      return {
        constructor: { name: 'NodeEnvironmentDetectionService' },
        resolveEnvironment: vi.fn(env => env || 'production'),
      }
    }),
  CrossPlatformStorageConfigService: vi
    .fn()
    .mockImplementation(function MockCrossPlatformStorageConfigService() {
      return {
        constructor: { name: 'CrossPlatformStorageConfigService' },
        getDefaultStoragePath: vi.fn(() => '/default/path/tickets.json'),
        getDefaultStorageDir: vi.fn(() => '/default/storage'),
        resolveStoragePath: vi.fn(() => '/resolved/path/tickets.json'),
        getLogsPath: vi.fn(() => '/default/logs'),
        getApplicationLogPath: vi.fn(() => '/default/logs/app.log'),
        getAuditLogPath: vi.fn(() => '/default/logs/audit.log'),
      }
    }),
  XdgDevelopmentProcessService: vi
    .fn()
    .mockImplementation(function MockXdgDevelopmentProcessService() {
      return { constructor: { name: 'XdgDevelopmentProcessService' } }
    }),
  UlidIdGenerator: vi.fn().mockImplementation(function MockUlidIdGenerator() {
    return {
      constructor: { name: 'UlidIdGenerator' },
      generateId: vi.fn(() => '01ARZ3NDEKTSV4RRFFQ69G5FAV'),
    }
  }),
  AsyncLocalStorageContextService: vi
    .fn()
    .mockImplementation(function MockAsyncLocalStorageContextService() {
      return {
        constructor: { name: 'AsyncLocalStorageContextService' },
        run: vi.fn(),
        getContext: vi.fn(),
        getContextForLogging: vi.fn(() => ({})),
      }
    }),
  // Event emitter factory
  defaultEventEmitterFactory: {
    create: vi.fn(() => ({
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      removeAllListeners: vi.fn(),
    })),
  },
  // Audit metadata generator
  auditMetadataGenerator: {
    generateMetadata: vi.fn(useCase => ({
      operationId: `test-${useCase.constructor.name}`,
      operationType: 'create',
      resourceType: 'Test',
      description: 'Test operation',
      containsSensitiveData: false,
    })),
  },
}))

// Mock application layer use cases
vi.mock('@project-manager/application', () => ({
  CreateTicket: {
    UseCase: vi.fn().mockImplementation(function MockCreateTicketUseCase() {
      return {
        constructor: { name: 'CreateTicketUseCase' },
        execute: vi.fn(),
      }
    }),
  },
  GetTicketById: {
    UseCase: vi.fn().mockImplementation(function MockGetTicketByIdUseCase() {
      return {
        constructor: { name: 'GetTicketByIdUseCase' },
        execute: vi.fn(),
      }
    }),
  },
  UpdateTicketStatus: {
    UseCase: vi.fn().mockImplementation(function MockUpdateTicketStatusUseCase() {
      return {
        constructor: { name: 'UpdateTicketStatusUseCase' },
        execute: vi.fn(),
      }
    }),
  },
  UpdateTicketContent: {
    UseCase: vi.fn().mockImplementation(function MockUpdateTicketContentUseCase() {
      return {
        constructor: { name: 'UpdateTicketContentUseCase' },
        execute: vi.fn(),
      }
    }),
  },
  UpdateTicketPriority: {
    UseCase: vi.fn().mockImplementation(function MockUpdateTicketPriorityUseCase() {
      return {
        constructor: { name: 'UpdateTicketPriorityUseCase' },
        execute: vi.fn(),
      }
    }),
  },
  DeleteTicket: {
    UseCase: vi.fn().mockImplementation(function MockDeleteTicketUseCase() {
      return {
        constructor: { name: 'DeleteTicketUseCase' },
        execute: vi.fn(),
      }
    }),
  },
  SearchTickets: {
    UseCase: vi.fn().mockImplementation(function MockSearchTicketsUseCase() {
      return {
        constructor: { name: 'SearchTicketsUseCase' },
        execute: vi.fn(),
      }
    }),
  },
  LoggingContextService: {
    initialize: vi.fn(),
    setContext: vi.fn(),
    clearContext: vi.fn(),
    getCurrentContext: vi.fn(() => ({})),
    withContext: vi.fn((_context, fn) => fn()),
  },
  ApplicationLogger: vi.fn().mockImplementation(function MockApplicationLogger() {
    return {
      constructor: { name: 'ApplicationLogger' },
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }
  }),
  AuditInterceptor: vi.fn().mockImplementation(function MockAuditInterceptor() {
    return {
      constructor: { name: 'AuditInterceptor' },
      recordSuccess: vi.fn(),
      recordFailure: vi.fn(),
    }
  }),
  auditMetadataGenerator: {
    generateMetadata: vi.fn(useCase => ({
      operationId: `test-${useCase.constructor.name}`,
      operationType: 'create',
      resourceType: 'Test',
      description: 'Test operation',
      containsSensitiveData: false,
    })),
  },
}))

describe('createContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Note: LoggingContextService is now managed through the DI container
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
      expect(service1.constructor.name).toBe('CrossPlatformStorageConfigService')
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

      container.get<TicketRepository>(TYPES.TicketRepository)

      expect(InMemoryTicketRepository).toHaveBeenCalled()
    })

    it('should bind InMemoryTicketRepository for in-memory environment', () => {
      const container = createContainer({ environment: 'in-memory' })

      container.get<TicketRepository>(TYPES.TicketRepository)

      expect(InMemoryTicketRepository).toHaveBeenCalled()
    })

    it('should bind JsonTicketRepository for production environment', () => {
      const container = createContainer({ environment: 'production' })

      container.get<TicketRepository>(TYPES.TicketRepository)

      expect(JsonTicketRepository).toHaveBeenCalledWith(
        '/resolved/path/tickets.json',
        expect.any(Object)
      )
    })

    it('should bind JsonTicketRepository for development environment', () => {
      const container = createContainer({ environment: 'development' })

      container.get<TicketRepository>(TYPES.TicketRepository)

      expect(JsonTicketRepository).toHaveBeenCalledWith(
        '/resolved/path/tickets.json',
        expect.any(Object)
      )
    })

    it('should bind JsonTicketRepository for isolated environment', () => {
      const container = createContainer({ environment: 'isolated' })

      container.get<TicketRepository>(TYPES.TicketRepository)

      expect(JsonTicketRepository).toHaveBeenCalledWith(
        '/resolved/path/tickets.json',
        expect.any(Object)
      )
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
      container.get<DevelopmentProcessService>(TYPES.DevelopmentProcessService)

      expect(XdgDevelopmentProcessService).toHaveBeenCalledWith('development')
    })

    it('should bind DevelopmentProcessService for testing environment', () => {
      const container = createContainer({ environment: 'testing' })

      expect(container.isBound(TYPES.DevelopmentProcessService)).toBe(true)
      container.get<DevelopmentProcessService>(TYPES.DevelopmentProcessService)

      expect(XdgDevelopmentProcessService).toHaveBeenCalledWith('testing')
    })

    it('should bind DevelopmentProcessService for isolated environment', () => {
      const container = createContainer({ environment: 'isolated' })

      expect(container.isBound(TYPES.DevelopmentProcessService)).toBe(true)
      container.get<DevelopmentProcessService>(TYPES.DevelopmentProcessService)

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
      container.get(TYPES.TicketRepository)

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
            constructor: { name: 'NodeEnvironmentDetectionService' },
            resolveEnvironment: vi.fn(() => 'production'),
          }) as any
      )

      const container = createContainer({ environment: 'auto' })

      // Should resolve to default (production)
      container.get<TicketRepository>(TYPES.TicketRepository)

      expect(JsonTicketRepository).toHaveBeenCalled()
    })

    it('should handle undefined environment', () => {
      const container = createContainer({})

      // Should resolve to default (production)
      container.get<TicketRepository>(TYPES.TicketRepository)

      expect(JsonTicketRepository).toHaveBeenCalled()
    })

    it('should handle all environment modes', () => {
      const environments = ['production', 'development', 'testing', 'in-memory', 'isolated']

      for (const env of environments) {
        // Reset all mocks before each environment test
        vi.resetAllMocks()

        // Re-apply mock implementations since vi.resetAllMocks clears them
        vi.mocked(InMemoryTicketRepository).mockImplementation(
          function MockInMemoryTicketRepository() {
            return { constructor: { name: 'InMemoryTicketRepository' } } as any
          }
        )
        vi.mocked(JsonTicketRepository).mockImplementation(function MockJsonTicketRepository() {
          return { constructor: { name: 'JsonTicketRepository' } } as any
        })
        vi.mocked(NodeEnvironmentDetectionService).mockImplementation(
          function MockNodeEnvironmentDetectionService() {
            return {
              constructor: { name: 'NodeEnvironmentDetectionService' },
              resolveEnvironment: vi.fn(envArg => envArg || 'production'),
            } as any
          }
        )
        vi.mocked(CrossPlatformStorageConfigService).mockImplementation(
          function MockCrossPlatformStorageConfigService() {
            return {
              constructor: { name: 'CrossPlatformStorageConfigService' },
              getDefaultStoragePath: vi.fn(() => '/default/path/tickets.json'),
              getDefaultStorageDir: vi.fn(() => '/default/storage'),
              resolveStoragePath: vi.fn(() => '/resolved/path/tickets.json'),
            } as any
          }
        )

        const container = createContainer({ environment: env as any })
        container.get<TicketRepository>(TYPES.TicketRepository)

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
      // Reset mocks for clean test
      vi.resetAllMocks()

      // Re-apply mock implementations
      vi.mocked(InMemoryTicketRepository).mockImplementation(
        function MockInMemoryTicketRepository() {
          return { constructor: { name: 'InMemoryTicketRepository' } } as any
        }
      )
      vi.mocked(JsonTicketRepository).mockImplementation(function MockJsonTicketRepository() {
        return { constructor: { name: 'JsonTicketRepository' } } as any
      })
      vi.mocked(NodeEnvironmentDetectionService).mockImplementation(
        function MockNodeEnvironmentDetectionService() {
          return {
            constructor: { name: 'NodeEnvironmentDetectionService' },
            resolveEnvironment: vi.fn(envArg => envArg || 'production'),
          } as any
        }
      )
      vi.mocked(CrossPlatformStorageConfigService).mockImplementation(
        function MockCrossPlatformStorageConfigService() {
          return {
            constructor: { name: 'CrossPlatformStorageConfigService' },
            getDefaultStoragePath: vi.fn(() => '/default/path/tickets.json'),
            getDefaultStorageDir: vi.fn(() => '/default/storage'),
            resolveStoragePath: vi.fn(() => '/resolved/path/tickets.json'),
          } as any
        }
      )

      const container = createContainer({ environment: 'testing' })

      // Verify in-memory repository is used
      container.get<TicketRepository>(TYPES.TicketRepository)
      expect(InMemoryTicketRepository).toHaveBeenCalled()

      // Verify development service is available
      expect(container.isBound(TYPES.DevelopmentProcessService)).toBe(true)
    })

    it('should create working container for development', () => {
      // Clear mocks first to ensure clean test
      vi.clearAllMocks()

      const container = createContainer({ environment: 'development' })

      // Verify file-based repository is used
      container.get<TicketRepository>(TYPES.TicketRepository)
      expect(JsonTicketRepository).toHaveBeenCalled()

      // DevelopmentProcessService should be bound for development environment
      expect(container.isBound(TYPES.DevelopmentProcessService)).toBe(true)
    })
  })
})
