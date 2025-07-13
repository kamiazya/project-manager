import type { TicketPriority, TicketStatus, TicketType } from '@project-manager/shared'

export interface GetAllTicketsFilters {
  status?: TicketStatus
  priority?: TicketPriority
  type?: TicketType
  limit?: number
}

export class GetAllTicketsRequest {
  constructor(public readonly filters: GetAllTicketsFilters = {}) {}
}
