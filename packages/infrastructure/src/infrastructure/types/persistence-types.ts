/**
 * Infrastructure layer persistence types
 * These types are specific to the infrastructure layer and handle persistence concerns
 */

import type { TicketPriorityKey, TicketStatusKey, TicketTypeKey } from '@project-manager/domain'

/**
 * JSON representation of a ticket for persistence
 * This is the format used when storing tickets in JSON files
 */
export interface TicketJSON {
  id: string
  title: string
  description?: string
  status: TicketStatusKey
  priority: TicketPriorityKey
  type: TicketTypeKey
  createdAt: string
  updatedAt: string
}
