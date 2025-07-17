/**
 * Infrastructure layer persistence types
 * These types are specific to the infrastructure layer and handle persistence concerns
 */

import type {
  TicketPriority,
  TicketPrivacy,
  TicketStatus,
  TicketType,
} from '@project-manager/domain'

/**
 * JSON representation of a ticket for persistence
 * This is the format used when storing tickets in JSON files
 */
export interface TicketJSON {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  type: TicketType
  privacy: TicketPrivacy
  createdAt: string
  updatedAt: string
}
