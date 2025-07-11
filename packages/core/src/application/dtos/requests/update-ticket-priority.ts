export class UpdateTicketPriorityRequest {
  constructor(
    public readonly id: string,
    public readonly newPriority: 'high' | 'medium' | 'low'
  ) {}
}
