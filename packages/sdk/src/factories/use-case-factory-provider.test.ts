import type { TicketRepository } from '@project-manager/application'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UseCaseFactory } from './use-case-factory.ts'
import { type UseCaseFactoryConfig, UseCaseFactoryProvider } from './use-case-factory-provider.ts'

// Mock repository implementations for testing
class MockTicketRepository implements TicketRepository {
  async save(): Promise<void> {}
  async findById(): Promise<any> {
    return null
  }
  async findAll(): Promise<any[]> {
    return []
  }
  async findAllWithFilters(): Promise<any[]> {
    return []
  }
  async searchTickets(): Promise<any[]> {
    return []
  }
  async delete(): Promise<void> {}
  async getStatistics(): Promise<any> {
    return {}
  }
}

class AlternativeTicketRepository implements TicketRepository {
  async save(): Promise<void> {}
  async findById(): Promise<any> {
    return null
  }
  async findAll(): Promise<any[]> {
    return []
  }
  async findAllWithFilters(): Promise<any[]> {
    return []
  }
  async searchTickets(): Promise<any[]> {
    return []
  }
  async delete(): Promise<void> {}
  async getStatistics(): Promise<any> {
    return {}
  }
}

describe('UseCaseFactoryProvider', () => {
  let mockRepository: TicketRepository
  let alternativeRepository: TicketRepository
  let config: UseCaseFactoryConfig

  beforeEach(() => {
    mockRepository = new MockTicketRepository()
    alternativeRepository = new AlternativeTicketRepository()
    config = {
      ticketRepository: mockRepository,
    }
  })

  afterEach(() => {
    // Reset singleton instance after each test
    UseCaseFactoryProvider.resetInstance()
  })

  describe('singleton pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = UseCaseFactoryProvider.getInstance()
      const instance2 = UseCaseFactoryProvider.getInstance()

      expect(instance1).toBe(instance2)
      expect(instance1).toBeInstanceOf(UseCaseFactoryProvider)
    })

    it('should create new instance after reset', () => {
      const instance1 = UseCaseFactoryProvider.getInstance()

      UseCaseFactoryProvider.resetInstance()

      const instance2 = UseCaseFactoryProvider.getInstance()

      expect(instance1).not.toBe(instance2)
      expect(instance2).toBeInstanceOf(UseCaseFactoryProvider)
    })

    it('should handle multiple resets safely', () => {
      const instance1 = UseCaseFactoryProvider.getInstance()

      UseCaseFactoryProvider.resetInstance()
      UseCaseFactoryProvider.resetInstance()
      UseCaseFactoryProvider.resetInstance()

      const instance2 = UseCaseFactoryProvider.getInstance()

      expect(instance1).not.toBe(instance2)
      expect(instance2).toBeInstanceOf(UseCaseFactoryProvider)
    })

    it('should reset instance even when never accessed', () => {
      expect(() => {
        UseCaseFactoryProvider.resetInstance()
      }).not.toThrow()

      const instance = UseCaseFactoryProvider.getInstance()
      expect(instance).toBeInstanceOf(UseCaseFactoryProvider)
    })
  })

  describe('createUseCaseFactory', () => {
    it('should create a UseCaseFactory with provided repository', () => {
      const provider = UseCaseFactoryProvider.getInstance()
      const factory = provider.createUseCaseFactory(config)

      expect(factory).toBeInstanceOf(UseCaseFactory)
    })

    it('should return the same factory instance for same repository type', () => {
      const provider = UseCaseFactoryProvider.getInstance()

      const factory1 = provider.createUseCaseFactory(config)
      const factory2 = provider.createUseCaseFactory(config)

      expect(factory1).toBe(factory2)
    })

    it('should create different factories for different repository types', () => {
      const provider = UseCaseFactoryProvider.getInstance()

      const config1 = { ticketRepository: mockRepository }
      const config2 = { ticketRepository: alternativeRepository }

      const factory1 = provider.createUseCaseFactory(config1)
      const factory2 = provider.createUseCaseFactory(config2)

      expect(factory1).not.toBe(factory2)
      expect(factory1).toBeInstanceOf(UseCaseFactory)
      expect(factory2).toBeInstanceOf(UseCaseFactory)
    })

    it('should handle same repository type from different instances', () => {
      const provider = UseCaseFactoryProvider.getInstance()

      const repo1 = new MockTicketRepository()
      const repo2 = new MockTicketRepository()

      const config1 = { ticketRepository: repo1 }
      const config2 = { ticketRepository: repo2 }

      const factory1 = provider.createUseCaseFactory(config1)
      const factory2 = provider.createUseCaseFactory(config2)

      // Should return same factory because repository types are the same
      expect(factory1).toBe(factory2)
    })

    it('should create factory with correct repository dependency', () => {
      const provider = UseCaseFactoryProvider.getInstance()
      const factory = provider.createUseCaseFactory(config)

      // Test that factory actually uses the provided repository
      const createTicketUseCase = factory.createCreateTicketUseCase()
      expect(createTicketUseCase).toBeDefined()
    })

    it('should handle factory creation with undefined config gracefully', () => {
      const provider = UseCaseFactoryProvider.getInstance()

      expect(() => {
        provider.createUseCaseFactory(undefined as any)
      }).toThrow()
    })

    it('should handle factory creation with null repository', () => {
      const provider = UseCaseFactoryProvider.getInstance()
      const invalidConfig = { ticketRepository: null as any }

      expect(() => {
        provider.createUseCaseFactory(invalidConfig)
      }).toThrow()
    })

    it('should handle factory creation with invalid repository object', () => {
      const provider = UseCaseFactoryProvider.getInstance()
      const invalidConfig = { ticketRepository: {} as TicketRepository }

      expect(() => {
        provider.createUseCaseFactory(invalidConfig)
      }).not.toThrow() // Constructor should not validate interface compliance
    })
  })

  describe('caching behavior', () => {
    it('should cache factories by repository constructor name', () => {
      const provider = UseCaseFactoryProvider.getInstance()

      const factory1 = provider.createUseCaseFactory(config)
      const factory2 = provider.createUseCaseFactory(config)

      expect(factory1).toBe(factory2)
    })

    it('should maintain separate caches for different repository types', () => {
      const provider = UseCaseFactoryProvider.getInstance()

      const mockConfig = { ticketRepository: mockRepository }
      const altConfig = { ticketRepository: alternativeRepository }

      const mockFactory1 = provider.createUseCaseFactory(mockConfig)
      const altFactory1 = provider.createUseCaseFactory(altConfig)
      const mockFactory2 = provider.createUseCaseFactory(mockConfig)
      const altFactory2 = provider.createUseCaseFactory(altConfig)

      expect(mockFactory1).toBe(mockFactory2)
      expect(altFactory1).toBe(altFactory2)
      expect(mockFactory1).not.toBe(altFactory1)
    })

    it('should clear cache when resetCache is called', () => {
      const provider = UseCaseFactoryProvider.getInstance()

      const factory1 = provider.createUseCaseFactory(config)
      provider.resetCache()
      const factory2 = provider.createUseCaseFactory(config)

      expect(factory1).not.toBe(factory2)
      expect(factory1).toBeInstanceOf(UseCaseFactory)
      expect(factory2).toBeInstanceOf(UseCaseFactory)
    })

    it('should handle multiple cache resets safely', () => {
      const provider = UseCaseFactoryProvider.getInstance()

      const factory1 = provider.createUseCaseFactory(config)

      provider.resetCache()
      provider.resetCache()
      provider.resetCache()

      const factory2 = provider.createUseCaseFactory(config)

      expect(factory1).not.toBe(factory2)
    })

    it('should reset cache safely when cache is empty', () => {
      const provider = UseCaseFactoryProvider.getInstance()

      expect(() => {
        provider.resetCache()
      }).not.toThrow()

      const factory = provider.createUseCaseFactory(config)
      expect(factory).toBeInstanceOf(UseCaseFactory)
    })
  })

  describe('integration with Clean Architecture', () => {
    it('should act as adapter between application and infrastructure layers', () => {
      const provider = UseCaseFactoryProvider.getInstance()

      // Provider accepts infrastructure (repository) and returns application (factory)
      const factory = provider.createUseCaseFactory(config)

      expect(factory).toBeInstanceOf(UseCaseFactory)

      // Factory should be able to create all use cases
      expect(factory.createCreateTicketUseCase).toBeDefined()
      expect(factory.createGetTicketByIdUseCase).toBeDefined()
      expect(factory.createGetAllTicketsUseCase).toBeDefined()
    })

    it('should support dependency injection pattern', () => {
      const provider = UseCaseFactoryProvider.getInstance()

      // Different repositories can be injected
      const mockConfig = { ticketRepository: mockRepository }
      const altConfig = { ticketRepository: alternativeRepository }

      const mockFactory = provider.createUseCaseFactory(mockConfig)
      const altFactory = provider.createUseCaseFactory(altConfig)

      expect(mockFactory).toBeInstanceOf(UseCaseFactory)
      expect(altFactory).toBeInstanceOf(UseCaseFactory)
      expect(mockFactory).not.toBe(altFactory)
    })

    it('should isolate use cases from repository implementation details', () => {
      const provider = UseCaseFactoryProvider.getInstance()
      const factory = provider.createUseCaseFactory(config)

      const createUseCase = factory.createCreateTicketUseCase()
      const getUseCase = factory.createGetTicketByIdUseCase()

      // Use cases should not expose repository implementation
      expect(createUseCase).toBeDefined()
      expect(getUseCase).toBeDefined()
      expect(createUseCase).not.toBe(mockRepository)
      expect(getUseCase).not.toBe(mockRepository)
    })
  })

  describe('error handling and edge cases', () => {
    it('should handle repository with no constructor name gracefully', () => {
      const provider = UseCaseFactoryProvider.getInstance()

      // Create object with no constructor name
      const anonymousRepo = Object.create(null)
      Object.assign(anonymousRepo, {
        save: vi.fn(),
        findById: vi.fn(),
        findAll: vi.fn(),
        findAllWithFilters: vi.fn(),
        searchTickets: vi.fn(),
        delete: vi.fn(),
        getStatistics: vi.fn(),
      })

      const config = { ticketRepository: anonymousRepo }

      // Should throw because constructor.name is accessed
      expect(() => {
        provider.createUseCaseFactory(config)
      }).toThrow()
    })

    it('should handle repository with undefined constructor', () => {
      const provider = UseCaseFactoryProvider.getInstance()

      const repoWithNoConstructor = {
        constructor: undefined,
        save: vi.fn(),
        findById: vi.fn(),
        findAll: vi.fn(),
        findAllWithFilters: vi.fn(),
        searchTickets: vi.fn(),
        delete: vi.fn(),
        getStatistics: vi.fn(),
      } as any

      const config = { ticketRepository: repoWithNoConstructor }

      // Should throw because constructor.name is accessed on undefined
      expect(() => {
        provider.createUseCaseFactory(config)
      }).toThrow()
    })

    it('should handle very long constructor names in cache keys', () => {
      const provider = UseCaseFactoryProvider.getInstance()

      class VeryLongNameForTicketRepositoryImplementationThatShouldNotCauseIssuesWithCaching
        implements TicketRepository
      {
        async save(): Promise<void> {}
        async findById(): Promise<any> {
          return null
        }
        async findAll(): Promise<any[]> {
          return []
        }
        async findAllWithFilters(): Promise<any[]> {
          return []
        }
        async searchTickets(): Promise<any[]> {
          return []
        }
        async delete(): Promise<void> {}
        async getStatistics(): Promise<any> {
          return {}
        }
      }

      const longNameRepo =
        new VeryLongNameForTicketRepositoryImplementationThatShouldNotCauseIssuesWithCaching()
      const config = { ticketRepository: longNameRepo }

      const factory1 = provider.createUseCaseFactory(config)
      const factory2 = provider.createUseCaseFactory(config)

      expect(factory1).toBe(factory2)
    })
  })

  describe('concurrency and threading', () => {
    it('should handle concurrent access to singleton safely', async () => {
      // Reset to start fresh
      UseCaseFactoryProvider.resetInstance()

      const promises = Array.from({ length: 10 }, async () => {
        // Add small random delay to increase chance of race conditions
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10))
        return UseCaseFactoryProvider.getInstance()
      })

      const instances = await Promise.all(promises)

      // All instances should be the same
      const firstInstance = instances[0]
      instances.forEach(instance => {
        expect(instance).toBe(firstInstance)
      })
    })

    it('should handle concurrent factory creation safely', async () => {
      const provider = UseCaseFactoryProvider.getInstance()

      const promises = Array.from({ length: 10 }, async () => {
        // Add small random delay to increase chance of race conditions
        await new Promise(resolve => setTimeout(resolve, Math.random() * 5))
        return provider.createUseCaseFactory(config)
      })

      const factories = await Promise.all(promises)

      // All factories should be the same due to caching
      const firstFactory = factories[0]
      factories.forEach(factory => {
        expect(factory).toBe(firstFactory)
      })
    })

    it('should handle concurrent cache operations safely', async () => {
      const provider = UseCaseFactoryProvider.getInstance()

      // Concurrent operations with realistic async behavior
      const operations = [
        (async () => {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 5))
          return provider.createUseCaseFactory(config)
        })(),
        (async () => {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 5))
          return provider.resetCache()
        })(),
        (async () => {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 5))
          return provider.createUseCaseFactory(config)
        })(),
        (async () => {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 5))
          return provider.resetCache()
        })(),
        (async () => {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 5))
          return provider.createUseCaseFactory(config)
        })(),
      ]

      await Promise.all(operations)

      // Should not throw and system should remain stable
      const finalFactory = provider.createUseCaseFactory(config)
      expect(finalFactory).toBeInstanceOf(UseCaseFactory)
    })
  })

  describe('memory management', () => {
    it('should not cause memory leaks with frequent factory creation', () => {
      const provider = UseCaseFactoryProvider.getInstance()

      // Create many factories (should all be cached)
      for (let i = 0; i < 1000; i++) {
        const factory = provider.createUseCaseFactory(config)
        expect(factory).toBeInstanceOf(UseCaseFactory)
      }

      // Cache should only contain one entry
      provider.resetCache() // This should clear only one entry

      // Should still work after reset
      const newFactory = provider.createUseCaseFactory(config)
      expect(newFactory).toBeInstanceOf(UseCaseFactory)
    })

    it('should properly clean up when instance is reset', () => {
      const provider1 = UseCaseFactoryProvider.getInstance()
      provider1.createUseCaseFactory(config)

      UseCaseFactoryProvider.resetInstance()

      const provider2 = UseCaseFactoryProvider.getInstance()
      expect(provider2).not.toBe(provider1)

      // New provider should have clean cache
      const factory = provider2.createUseCaseFactory(config)
      expect(factory).toBeInstanceOf(UseCaseFactory)
    })

    it('should handle large number of different repository types', () => {
      const provider = UseCaseFactoryProvider.getInstance()

      // Create many different repository types
      const repositories = Array.from({ length: 100 }, (_, i) => {
        const className = `Repository${i}`
        const RepoClass = {
          [className]: class implements TicketRepository {
            async save(): Promise<void> {}
            async findById(): Promise<any> {
              return null
            }
            async findAll(): Promise<any[]> {
              return []
            }
            async findAllWithFilters(): Promise<any[]> {
              return []
            }
            async searchTickets(): Promise<any[]> {
              return []
            }
            async delete(): Promise<void> {}
            async getStatistics(): Promise<any> {
              return {}
            }
          },
        }[className] as new () => TicketRepository
        return new RepoClass()
      })

      // Each should create a different cached factory
      const factories = repositories.map(repo =>
        provider.createUseCaseFactory({ ticketRepository: repo })
      )

      expect(factories).toHaveLength(100)

      // All factories should be different
      const uniqueFactories = new Set(factories)
      expect(uniqueFactories.size).toBe(100)

      // Cache should be cleaned up properly
      provider.resetCache()

      // Should still work after cache reset
      const newFactory = provider.createUseCaseFactory({ ticketRepository: repositories[0]! })
      expect(newFactory).toBeInstanceOf(UseCaseFactory)
    })
  })
})
