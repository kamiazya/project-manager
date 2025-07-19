/**
 * @project-manager/sdk
 *
 * TypeScript SDK for Project Manager
 * Provides a unified Facade interface to all Project Manager functionality
 */

export type {
  CreateTicketRequest,
  SearchTicketsRequest,
  TicketResponse,
  UpdateTicketContentRequest,
} from './project-manager-sdk.ts'
export { ProjectManagerSDK } from './project-manager-sdk.ts'
export type { SDKConfig } from './sdk-container.ts'
export { SDKContainer } from './sdk-container.ts'

/**
 * Convenience factory function for creating SDK instance
 */
export async function createProjectManagerSDK(config: import('./sdk-container.ts').SDKConfig = {}) {
  const { SDKContainer } = await import('./sdk-container.ts')
  const { ProjectManagerSDK } = await import('./project-manager-sdk.ts')

  const useCaseFactory = await SDKContainer.create(config)
  return ProjectManagerSDK.create(useCaseFactory)
}

/**
 * Convenience factory functions for common configurations
 */
export const ProjectManagerSDKFactory = {
  /**
   * Create SDK for CLI application
   */
  async forCLI(options: { environment?: 'development' | 'production' | 'test' } = {}) {
    return createProjectManagerSDK({
      appType: 'cli',
      environment: options.environment || 'production',
      enableDebugLogging: options.environment === 'development',
    })
  },

  /**
   * Create SDK for MCP server
   */
  async forMCP(options: { environment?: 'development' | 'production' | 'test' } = {}) {
    return createProjectManagerSDK({
      appType: 'mcp',
      environment: options.environment || 'production',
      enableDebugLogging: options.environment === 'development',
    })
  },

  /**
   * Create SDK for testing
   */
  async forTesting(options: { storagePath?: string; dataDirectory?: string } = {}) {
    return createProjectManagerSDK({
      appType: 'custom',
      environment: 'test',
      enableDebugLogging: true,
      storagePath: options.storagePath,
      dataDirectory: options.dataDirectory,
    })
  },

  /**
   * Create SDK with custom configuration
   */
  async withConfig(config: import('./sdk-container.ts').SDKConfig) {
    return createProjectManagerSDK(config)
  },
}
