/**
 * Domain types for Ticket management
 */
import type { Brand } from '@project-manager/base'
import { ValidationError } from '@project-manager/base'

/**
 * Possible states of a ticket in its lifecycle
 */
export type TicketStatusKey = Brand<string, 'TicketStatusKey'>

/**
 * Types of tickets based on their nature
 */
export type TicketTypeKey = Brand<string, 'TicketTypeKey'>

/**
 * Priority levels for tickets
 */
export type TicketPriorityKey = Brand<string, 'TicketPriorityKey'>

/**
 * Validation pattern for ticket keys: lowercase letters and underscores, 1+ characters
 */
const TICKET_KEY_PATTERN = /^[a-z_]+$/

/**
 * Create a ticket status from a string
 */
export function createTicketStatus(value: string): TicketStatusKey {
  if (!value || !TICKET_KEY_PATTERN.test(value)) {
    throw new ValidationError(
      `Invalid ticket status: ${value}. Must contain only lowercase letters and underscores.`,
      'ticketStatus',
      value
    )
  }
  return value as TicketStatusKey
}

/**
 * Create a ticket type from a string
 */
export function createTicketType(value: string): TicketTypeKey {
  if (!value || !TICKET_KEY_PATTERN.test(value)) {
    throw new ValidationError(
      `Invalid ticket type: ${value}. Must contain only lowercase letters and underscores.`,
      'ticketType',
      value
    )
  }
  return value as TicketTypeKey
}

/**
 * Create a ticket priority from a string
 */
export function createTicketPriority(value: string): TicketPriorityKey {
  if (!value || !TICKET_KEY_PATTERN.test(value)) {
    throw new ValidationError(
      `Invalid ticket priority: ${value}. Must contain only lowercase letters and underscores.`,
      'ticketPriority',
      value
    )
  }
  return value as TicketPriorityKey
}
