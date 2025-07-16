import { Args, Flags } from '@oclif/core'
import { CreateTicket } from '@project-manager/core'
import type { TicketPriority, TicketType } from '@project-manager/shared'
import { BaseCommand } from '../../lib/base-command.ts'
import { getCreateTicketUseCase } from '../../utils/service-factory.ts'

interface ExecuteArgs extends Record<string, unknown> {
  title: string
}

interface ExecuteFlags extends Record<string, unknown> {
  description: string
  priority: string // Can be shortcuts or full names
  type: string // Can be shortcuts or full names
  json?: boolean // Inherited from BaseCommand
}

/**
 * Quickly create a new ticket
 */
export class QuickNewCommand extends BaseCommand<ExecuteArgs, ExecuteFlags, void> {
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

  async execute(args: ExecuteArgs, flags: ExecuteFlags): Promise<void> {
    // Expand shortcuts
    const priority = this.expandPriorityShortcut(flags.priority)
    const type = this.expandTypeShortcut(flags.type)

    // Create ticket
    const createTicketUseCase = getCreateTicketUseCase()
    const request = new CreateTicket.Request(args.title.trim(), flags.description, priority, type)
    const ticket = await createTicketUseCase.execute(request)

    this.log(`Ticket ${ticket.id} created successfully.`)
  }

  /**
   * Expand priority shortcuts to full names
   */
  private expandPriorityShortcut(priority: string): TicketPriority {
    switch (priority) {
      case 'h':
        return 'high'
      case 'm':
        return 'medium'
      case 'l':
        return 'low'
      default:
        return priority as TicketPriority
    }
  }

  /**
   * Expand type shortcuts to full names
   */
  private expandTypeShortcut(type: string): TicketType {
    switch (type) {
      case 'f':
        return 'feature'
      case 'b':
        return 'bug'
      case 't':
        return 'task'
      default:
        return type as TicketType
    }
  }
}
