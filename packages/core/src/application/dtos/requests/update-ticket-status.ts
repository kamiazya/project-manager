import type { TicketStatus } from '@project-manager/shared'

export class UpdateTicketStatusRequest {
  constructor(
    public readonly id: string,
    public readonly newStatus: TicketStatus
  ) {}
}
