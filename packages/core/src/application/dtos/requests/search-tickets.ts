import type { TicketSearchCriteria } from '@project-manager/shared'

export class SearchTicketsRequest {
  constructor(public readonly criteria: TicketSearchCriteria) {}
}
