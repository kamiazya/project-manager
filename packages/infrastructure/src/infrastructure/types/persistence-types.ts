/**
 * Infrastructure layer persistence types
 * These types are specific to the infrastructure layer and handle persistence concerns
 */

import type {
  AliasType,
  TicketPriorityKey,
  TicketStatusKey,
  TicketTypeKey,
} from '@project-manager/domain'

/**
 * JSON representation of alias for persistence
 */
export interface AliasJSON {
  value: string
  type: AliasType
}

/**
 * JSON representation of ticket aliases collection for persistence
 */
export interface TicketAliasCollectionJSON {
  canonical?: AliasJSON
  custom: AliasJSON[]
}

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
  aliases?: TicketAliasCollectionJSON
  createdAt: string
  updatedAt: string
}
