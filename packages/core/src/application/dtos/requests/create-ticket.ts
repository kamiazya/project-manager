import type { CreateTicketData } from '../../../domain/entities/ticket.ts'

export class CreateTicketRequest {
  constructor(
    public readonly title: string,
    public readonly description: string,
    public readonly priority?: 'high' | 'medium' | 'low',
    public readonly type?: 'feature' | 'bug' | 'task',
    public readonly privacy?: 'local-only' | 'shareable' | 'public'
  ) {}

  toCreateTicketData(): CreateTicketData {
    return {
      title: this.title,
      description: this.description,
      priority: this.priority || 'medium',
      type: this.type || 'task',
      privacy: this.privacy || 'local-only',
    }
  }
}
