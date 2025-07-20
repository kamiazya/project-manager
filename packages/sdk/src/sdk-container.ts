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

// Global state for singleton pattern
let factoryInstance: UseCaseFactory | null = null

/**
 * Create configured Use Case Factory
 */
export async function createSDKContainer(config: SDKConfig = {}): Promise<UseCaseFactory> {
  // Skip singleton for test environment to ensure test isolation
  if (factoryInstance && config.environment !== 'test') {
    return factoryInstance
  }

  // Import required modules
  const infrastructureModule = await import('@project-manager/infrastructure')

  // Configure storage path with priority order:
  // 1. storagePath (direct path)
  // 2. XDG-compliant default
  const storagePath = resolveStoragePath(config)

  // Configure repository
  const repository =
    config.customRepository || new infrastructureModule.JsonTicketRepository(storagePath)

  // Configure Use Case Factory
  const { UseCaseFactoryProvider } = await import('./factories/use-case-factory-provider.ts')
  const provider = UseCaseFactoryProvider.getInstance()
  const factory = provider.createUseCaseFactory({ ticketRepository: repository })

  // Don't cache instance in test environment to ensure test isolation
  if (config.environment !== 'test') {
    factoryInstance = factory
  }
  return factory
}

/**
 * Reset factory instance (for testing)
 */
export async function resetSDKContainer(): Promise<void> {
  factoryInstance = null

  // Also reset the underlying UseCaseFactoryProvider for test isolation
  const { UseCaseFactoryProvider } = await import('./factories/use-case-factory-provider.ts')
  UseCaseFactoryProvider.resetInstance()
}

/**
 * Resolve storage path with priority order
 */
function resolveStoragePath(config: SDKConfig): string {
  // Priority 1: Direct storage path
  if (config.storagePath) {
    return config.storagePath
  }

  // Priority 2: XDG-compliant default using Node.js built-ins directly
  // Import Node.js modules
  const os = require('node:os')
  const path = require('node:path')

  const homeDir = os.homedir()
  const configHome = process.env.XDG_CONFIG_HOME || path.join(homeDir, '.config')
  const isDevelopment = process.env.NODE_ENV === 'development'
  const dirName = isDevelopment ? 'project-manager-dev' : 'project-manager'

  return path.join(configHome, dirName, 'tickets.json')
}

/**
 * Get resolved configuration for debugging
 */
export function getResolvedSDKConfig(config: SDKConfig): {
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
export async function getSDKStoragePath(config: SDKConfig = {}): Promise<string> {
  // This is a helper method that can be called without creating the full container
  return resolveStoragePath(config)
}

// Backward compatibility exports
export const SDKContainer = {
  create: createSDKContainer,
  reset: resetSDKContainer,
  getResolvedConfig: getResolvedSDKConfig,
  getStoragePath: getSDKStoragePath,
}
