export type TicketStatus = 'pending' | 'in_progress' | 'completed' | 'archived'
export type TicketPriority = 'high' | 'medium' | 'low'
export type TicketType = 'feature' | 'bug' | 'task'
export type TicketPrivacy = 'local-only' | 'shareable' | 'public'

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

export interface TicketData {
  title: string
  description: string
  priority: TicketPriority
  status?: TicketStatus
  type?: TicketType
  privacy?: TicketPrivacy
}

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

export interface TicketSearchCriteria {
  title?: string
  status?: TicketStatus
  priority?: TicketPriority
  type?: TicketType
  privacy?: TicketPrivacy
  search?: string
}

export interface TicketStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  archived: number
  byPriority: {
    high: number
    medium: number
    low: number
  }
  byType: {
    feature: number
    bug: number
    task: number
  }
}
