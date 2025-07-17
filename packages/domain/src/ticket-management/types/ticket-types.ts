/**
 * Domain types for the Ticket aggregate
 * These are pure domain types without external dependencies
 */

export type TicketStatus = 'pending' | 'in_progress' | 'completed' | 'archived'
export type TicketPriority = 'high' | 'medium' | 'low'
export type TicketType = 'feature' | 'bug' | 'task'
export type TicketPrivacy = 'public' | 'team' | 'local-only'

/**
 * Domain defaults for ticket creation
 */
export const TICKET_DEFAULTS = {
  TYPE: 'task' as TicketType,
  PRIORITY: 'medium' as TicketPriority,
  PRIVACY: 'local-only' as TicketPrivacy,
  STATUS: 'pending' as TicketStatus,
} as const

/**
 * Validates if a string is a valid TicketStatus
 */
export function isValidTicketStatus(value: string): value is TicketStatus {
  return ['pending', 'in_progress', 'completed', 'archived'].includes(value)
}

/**
 * Validates if a string is a valid TicketPriority
 */
export function isValidTicketPriority(value: string): value is TicketPriority {
  return ['high', 'medium', 'low'].includes(value)
}

/**
 * Validates if a string is a valid TicketType
 */
export function isValidTicketType(value: string): value is TicketType {
  return ['feature', 'bug', 'task'].includes(value)
}

/**
 * Validates if a string is a valid TicketPrivacy
 */
export function isValidTicketPrivacy(value: string): value is TicketPrivacy {
  return ['public', 'team', 'local-only'].includes(value)
}

/**
 * Domain error for ticket validation
 */
export class TicketValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message)
    this.name = 'TicketValidationError'
  }
}
