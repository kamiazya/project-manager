/**
 * @project-manager/sdk
 *
 * TypeScript SDK for Project Manager
 * Provides a unified Facade interface to all Project Manager functionality
 */

import { ProjectManagerSDK } from './project-manager-sdk.ts'
import type { SDKConfig } from './sdk-container.ts'
import { SDKContainer } from './sdk-container.ts'

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
export async function createProjectManagerSDK(config: SDKConfig = {}) {
  const useCaseFactory = await SDKContainer.create(config)
  return ProjectManagerSDK.create(useCaseFactory)
}
