/**
 * SDK Container Factory
 *
 * Creates and configures the Dependency Injection container for the SDK
 */

import type { TicketRepository, UseCaseFactory } from '@project-manager/application'

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
   * Application type for context-specific configuration
   */
  appType?: 'cli' | 'mcp' | 'sdk' | 'custom'

  /**
   * Custom repository implementation
   * For advanced use cases or testing
   */
  customRepository?: TicketRepository

  /**
   * Enable debug logging
   */
  enableDebugLogging?: boolean

  /**
   * Custom data directory override
   * Takes precedence over storagePath
   */
  dataDirectory?: string
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
    const storagePath = SDKContainer.resolveStoragePath(config, infrastructureModule)

    // Configure repository
    const repository =
      config.customRepository || new infrastructureModule.JsonTicketRepository(storagePath)

    // Configure Use Case Factory
    const provider = applicationModule.UseCaseFactoryProvider.getInstance()
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
    const applicationModule = await import('@project-manager/application')
    applicationModule.UseCaseFactoryProvider.resetInstance()
  }

  /**
   * Resolve storage path with priority order and app type consideration
   */
  private static resolveStoragePath(config: SDKConfig, infrastructureModule: any): string {
    // Priority 1: Custom data directory override
    if (config.dataDirectory) {
      return `${config.dataDirectory}/tickets.json`
    }

    // Priority 2: Direct storage path
    if (config.storagePath) {
      return config.storagePath
    }

    // Priority 3: XDG-compliant default with app type consideration
    const environment = config.environment || 'production'
    const appType = config.appType || 'sdk'

    // For development, use app-specific subdirectories to avoid conflicts
    if (environment === 'development') {
      const baseDir = infrastructureModule.getStoragePath()
      const appDir = baseDir.replace('tickets.json', `${appType}/tickets.json`)
      return appDir
    }

    // For production and test, use standard path
    return infrastructureModule.getStoragePath()
  }

  /**
   * Get resolved configuration for debugging
   */
  static getResolvedConfig(config: SDKConfig): {
    storagePath: string
    environment: string
    appType: string
    enableDebugLogging: boolean
  } {
    return {
      storagePath: config.storagePath || 'XDG-compliant default',
      environment: config.environment || 'production',
      appType: config.appType || 'sdk',
      enableDebugLogging: config.enableDebugLogging || false,
    }
  }

  /**
   * Get storage path for given configuration
   */
  static async getStoragePath(config: SDKConfig = {}): Promise<string> {
    // This is a helper method that can be called without creating the full container
    const infrastructureModule = await import('@project-manager/infrastructure')
    return SDKContainer.resolveStoragePath(config, infrastructureModule)
  }
}
