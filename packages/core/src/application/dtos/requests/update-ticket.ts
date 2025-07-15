import type { TicketPriority, TicketStatus } from '@project-manager/shared'

/**
 * Request DTO for updating multiple ticket fields in a single operation.
 * All fields except `id` are optional, allowing for partial updates.
 */
export class UpdateTicketRequest {
  constructor(
    public readonly id: string,
    public readonly title?: string,
    public readonly description?: string,
    public readonly status?: TicketStatus,
    public readonly priority?: TicketPriority
  ) {}

  /**
   * Returns true if at least one field is provided for update
   */
  public hasUpdates(): boolean {
    return (
      this.title !== undefined ||
      this.description !== undefined ||
      this.status !== undefined ||
      this.priority !== undefined
    )
  }
}
