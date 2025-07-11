export type TicketStatus = 'pending' | 'in_progress' | 'completed' | 'archived'
export type TicketPriority = 'high' | 'medium' | 'low'
export type TicketType = 'feature' | 'bug' | 'task'
export type TicketPrivacy = 'local-only' | 'shareable' | 'public'

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
