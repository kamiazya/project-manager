import { Args, Flags } from '@oclif/core'
import type { CreateTicketUseCase } from '@project-manager/core'
import { CreateTicketRequest, TYPES } from '@project-manager/core'
import { BaseCommand } from '../../lib/base-command.ts'

/**
 * Quickly create a new ticket
 */
export class QuickNewCommand extends BaseCommand {
  static override description = 'Quickly create a new ticket'
  static override aliases = ['q:n']

  static override examples = [
    '<%= config.bin %> <%= command.id %> "Fix login bug"',
    '<%= config.bin %> <%= command.id %> "Add dashboard" -d "Create user dashboard" -p h -t f',
  ]

  static override args = {
    title: Args.string({
      description: 'Ticket title',
      required: true,
    }),
  }

  static override flags = {
    description: Flags.string({
      char: 'd',
      description: 'Ticket description',
      default: '',
    }),
    priority: Flags.string({
      char: 'p',
      description: 'Priority (h=high, m=medium, l=low)',
      options: ['h', 'm', 'l', 'high', 'medium', 'low'],
      default: 'm',
    }),
    type: Flags.string({
      char: 't',
      description: 'Type (f=feature, b=bug, t=task)',
      options: ['f', 'b', 't', 'feature', 'bug', 'task'],
      default: 't',
    }),
  }

  async execute(args: { title: string }, flags: any): Promise<any> {
    // Expand shortcuts
    const priority = this.expandPriorityShortcut(flags.priority)
    const type = this.expandTypeShortcut(flags.type)

    // Create ticket
    const createTicketUseCase = this.getService<CreateTicketUseCase>(TYPES.CreateTicketUseCase)
    const request = new CreateTicketRequest(
      args.title.trim(),
      flags.description,
      priority as 'high' | 'medium' | 'low',
      type as 'feature' | 'bug' | 'task'
    )
    const ticket = await createTicketUseCase.execute(request)

    this.log(`Ticket ${ticket.id} created successfully.`)
  }

  /**
   * Expand priority shortcuts to full names
   */
  private expandPriorityShortcut(priority: string): string {
    switch (priority) {
      case 'h':
        return 'high'
      case 'm':
        return 'medium'
      case 'l':
        return 'low'
      default:
        return priority
    }
  }

  /**
   * Expand type shortcuts to full names
   */
  private expandTypeShortcut(type: string): string {
    switch (type) {
      case 'f':
        return 'feature'
      case 'b':
        return 'bug'
      case 't':
        return 'task'
      default:
        return type
    }
  }
}
