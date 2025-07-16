/**
 * Data Transfer Object for ticket statistics
 * Used by application layer to transfer statistical data
 */
export interface TicketStatistics {
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

/**
 * Factory for creating empty ticket statistics
 */
export function createEmptyTicketStatistics(): TicketStatistics {
  return {
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    archived: 0,
    byPriority: {
      high: 0,
      medium: 0,
      low: 0,
    },
    byType: {
      feature: 0,
      bug: 0,
      task: 0,
    },
  }
}
