/**
 * Provider for creating UseCaseFactory instances
 * This acts as the boundary between application and infrastructure layers
 * Following Clean Architecture principles
 */

import type { TicketRepository } from '../repositories/ticket-repository.ts'
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

    // Validate ticketRepository has a constructor
    if (!config.ticketRepository.constructor) {
      throw new Error('ticketRepository must have a valid constructor')
    }

    // Validate constructor has a name (for caching)
    if (!config.ticketRepository.constructor.name) {
      throw new Error('ticketRepository constructor must have a name for caching')
    }

    const cacheKey = config.ticketRepository.constructor.name

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
