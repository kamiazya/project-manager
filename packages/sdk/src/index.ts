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
  UpdateTicketRequest,
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

  const container = await SDKContainer.create(config)
  return ProjectManagerSDK.create(container)
}
