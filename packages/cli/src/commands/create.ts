import { input, select } from '@inquirer/prompts'
import { Args, Flags } from '@oclif/core'
import type { CreateTicketUseCase } from '@project-manager/core'
import { CreateTicketRequest, TYPES } from '@project-manager/core'
import { BaseCommand } from '../lib/base-command.ts'

/**
 * Create a new ticket
 */
export class CreateCommand extends BaseCommand {
  static override description = 'Create a new ticket'

  static override examples = [
    '<%= config.bin %> <%= command.id %> "Fix login bug"',
    '<%= config.bin %> <%= command.id %> "Add user dashboard" -d "Create user dashboard with analytics" -p h -t f',
    '<%= config.bin %> <%= command.id %> # Interactive mode',
  ]

  static override args = {
    title: Args.string({
      description: 'Ticket title (optional, will prompt if not provided)',
      required: false,
    }),
  }

  static override flags = {
    description: Flags.string({
      char: 'd',
      description: 'Ticket description',
    }),
    priority: Flags.string({
      char: 'p',
      description: 'Priority: h(igh), m(edium), l(ow)',
      options: ['h', 'm', 'l', 'high', 'medium', 'low'],
    }),
    type: Flags.string({
      char: 't',
      description: 'Type: f(eature), b(ug), t(ask)',
      options: ['f', 'b', 't', 'feature', 'bug', 'task'],
    }),
  }

  async execute(args: { title?: string }, flags: any): Promise<any> {
    // Determine if we should use interactive mode
    const isInteractive = !args.title

    // Get title - from args or interactive input
    let title = args.title
    if (!title) {
      title = await input({
        message: 'Title:',
      })
    }

    // Validate title
    if (!title || title.trim() === '') {
      this.error('Title cannot be empty')
    }

    // Get description - from flags or interactive input
    let description = flags.description || ''
    if (isInteractive && !flags.description) {
      description = await input({
        message: 'Description:',
        default: '',
      })
    }

    // Get priority - from flags or interactive input
    let priority = flags.priority ? this.expandPriorityShortcut(flags.priority) : 'medium'
    if (isInteractive && !flags.priority) {
      priority = await select({
        message: 'Priority:',
        choices: [
          { name: 'High', value: 'high' },
          { name: 'Medium', value: 'medium' },
          { name: 'Low', value: 'low' },
        ],
        default: 'medium',
      })
    }

    // Get type - from flags or interactive input
    let type = flags.type ? this.expandTypeShortcut(flags.type) : 'task'
    if (isInteractive && !flags.type) {
      type = await select({
        message: 'Type:',
        choices: [
          { name: 'Feature', value: 'feature' },
          { name: 'Bug', value: 'bug' },
          { name: 'Task', value: 'task' },
        ],
        default: 'task',
      })
    }

    // Create ticket
    const createTicketUseCase = this.getService<CreateTicketUseCase>(TYPES.CreateTicketUseCase)
    const request = new CreateTicketRequest(
      title.trim(),
      description,
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
