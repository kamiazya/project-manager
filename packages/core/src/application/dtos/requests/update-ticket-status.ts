export class UpdateTicketStatusRequest {
  constructor(
    public readonly id: string,
    public readonly newStatus: 'pending' | 'in_progress' | 'completed' | 'archived'
  ) {}
}
