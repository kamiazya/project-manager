/**
 * @project-manager/sdk
 *
 * TypeScript SDK for Project Manager
 * Provides a unified Facade interface to all Project Manager functionality
 */

// Re-export application interfaces that are exposed through SDK
export type { DevelopmentProcessService } from '@project-manager/application'
export type {
  CreateTicketRequest,
  SDKConfig,
  SearchTicketsRequest,
  TicketResponse,
  UpdateTicketContentRequest,
} from './project-manager-sdk.ts'
export {
  createProjectManagerSDK,
  ProjectManagerSDK,
} from './project-manager-sdk.ts'

// Note: Internal types and inversify are not exported to keep the API clean
