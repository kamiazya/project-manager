/**
 * SDK Container Factory
 *
 * Creates and configures the Dependency Injection container for the SDK
 */

import type { TicketRepository } from '@project-manager/application'
import type { UseCaseFactory } from './factories/use-case-factory.ts'

/**
 * SDK Configuration options
 */
export interface SDKConfig {
  /**
   * Storage path for data files
   * If not provided, uses XDG Base Directory compliant path
   */
  storagePath?: string

  /**
   * Environment configuration
   * Affects logging, error handling, and performance optimizations
   */
  environment?: 'development' | 'production' | 'test'

  /**
   * Custom repository implementation
   * For advanced use cases or testing
   */
  customRepository?: TicketRepository
}

/**
 * Creates and configures Use Case Factory for SDK
 * Simplified DI using only UseCaseFactory, removing inversify dependency
 */
export class SDKContainer {
  private static instance: UseCaseFactory | null = null

  /**
   * Create configured Use Case Factory
   */
  static async create(config: SDKConfig = {}): Promise<UseCaseFactory> {
    // Skip singleton for test environment to ensure test isolation
    if (SDKContainer.instance && config.environment !== 'test') {
      return SDKContainer.instance
    }

    // Import required modules
    const applicationModule = await import('@project-manager/application')
    const infrastructureModule = await import('@project-manager/infrastructure')

    // Configure storage path with priority order:
    // 1. dataDirectory (custom override)
    // 2. storagePath (direct path)
    // 3. XDG-compliant default with app type consideration
    const storagePath = SDKContainer.resolveStoragePath(config, applicationModule)

    // Configure repository
    const repository =
      config.customRepository || new infrastructureModule.JsonTicketRepository(storagePath)

    // Configure Use Case Factory
    const { UseCaseFactoryProvider } = await import('./factories/use-case-factory-provider.ts')
    const provider = UseCaseFactoryProvider.getInstance()
    const factory = provider.createUseCaseFactory({ ticketRepository: repository })

    // Don't cache instance in test environment to ensure test isolation
    if (config.environment !== 'test') {
      SDKContainer.instance = factory
    }
    return factory
  }

  /**
   * Reset factory instance (for testing)
   */
  static async reset(): Promise<void> {
    SDKContainer.instance = null

    // Also reset the underlying UseCaseFactoryProvider for test isolation
    const { UseCaseFactoryProvider } = await import('./factories/use-case-factory-provider.ts')
    UseCaseFactoryProvider.resetInstance()
  }

  /**
   * Resolve storage path with priority order
   */
  private static resolveStoragePath(config: SDKConfig, applicationModule: any): string {
    // Priority 1: Direct storage path
    if (config.storagePath) {
      return config.storagePath
    }

    // Priority 2: XDG-compliant default
    return applicationModule.StorageConfigService.resolveStoragePath()
  }

  /**
   * Get resolved configuration for debugging
   */
  static getResolvedConfig(config: SDKConfig): {
    storagePath: string
    environment: string
  } {
    return {
      storagePath: config.storagePath || 'XDG-compliant default',
      environment: config.environment || 'production',
    }
  }

  /**
   * Get storage path for given configuration
   */
  static async getStoragePath(config: SDKConfig = {}): Promise<string> {
    // This is a helper method that can be called without creating the full container
    const applicationModule = await import('@project-manager/application')
    return SDKContainer.resolveStoragePath(config, applicationModule)
  }
}
