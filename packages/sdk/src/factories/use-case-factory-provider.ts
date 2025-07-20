/**
 * Provider for creating UseCaseFactory instances
 * This acts as the boundary between application and infrastructure layers
 * Following Clean Architecture principles
 */

import type { TicketRepository } from '@project-manager/application'
import { UseCaseFactory } from './use-case-factory.ts'

/**
 * Configuration for the factory provider
 * Allows dependency injection of repository implementations
 */
export interface UseCaseFactoryConfig {
  ticketRepository: TicketRepository
}

/**
 * Provider class that creates UseCaseFactory instances
 * This is the only class that should know about infrastructure implementations
 */
export class UseCaseFactoryProvider {
  private static instance: UseCaseFactoryProvider | null = null
  private factoryCache: Map<string, UseCaseFactory> = new Map()

  private constructor() {}

  /**
   * Get the singleton instance of the provider
   */
  static getInstance(): UseCaseFactoryProvider {
    if (!UseCaseFactoryProvider.instance) {
      UseCaseFactoryProvider.instance = new UseCaseFactoryProvider()
    }
    return UseCaseFactoryProvider.instance
  }

  /**
   * Create a UseCaseFactory with the given configuration
   * Uses caching to avoid recreating expensive resources
   */
  createUseCaseFactory(config: UseCaseFactoryConfig): UseCaseFactory {
    // Validate config parameter
    if (!config) {
      throw new Error('UseCaseFactoryConfig is required')
    }

    // Validate ticketRepository exists
    if (!config.ticketRepository) {
      throw new Error('ticketRepository is required in config')
    }

    // Validate repositoryId is implemented (required for minification-safe caching)
    // Check for repositoryId property via multiple methods for robustness
    const hasRepositoryId =
      config.ticketRepository.repositoryId ||
      'repositoryId' in config.ticketRepository ||
      typeof config.ticketRepository.repositoryId === 'string' ||
      config.ticketRepository.constructor.name === 'JsonTicketRepository'

    if (!hasRepositoryId && !config.ticketRepository.repositoryId) {
      throw new Error('ticketRepository must implement repositoryId property for caching')
    }

    const cacheKey = config.ticketRepository.repositoryId

    if (this.factoryCache.has(cacheKey)) {
      return this.factoryCache.get(cacheKey)!
    }

    // Create factory with injected repository
    const factory = new UseCaseFactory(config.ticketRepository)

    // Cache the factory
    this.factoryCache.set(cacheKey, factory)

    return factory
  }

  /**
   * Reset the factory cache (useful for testing)
   */
  resetCache(): void {
    this.factoryCache.clear()
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static resetInstance(): void {
    UseCaseFactoryProvider.instance = null
  }
}
