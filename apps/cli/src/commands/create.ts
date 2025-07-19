import { input, select } from '@inquirer/prompts'
import { Args, Flags } from '@oclif/core'
import { createTicketPriority, createTicketType } from '@project-manager/domain'
import { BaseCommand } from '../lib/base-command.ts'

interface ExecuteArgs extends Record<string, unknown> {
  title?: string
}

interface ExecuteFlags extends Record<string, unknown> {
  description?: string
  priority?: string
  type?: string
  json?: boolean
}

/**
 * Create a new ticket
 */
export class CreateCommand extends BaseCommand<ExecuteArgs, ExecuteFlags, void> {
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

  async execute(args: ExecuteArgs, flags: ExecuteFlags): Promise<void> {
    // Determine if we should use interactive mode
    const isInteractive = !args.title || args.title.trim() === ''

    // Get title - from args or interactive input
    let title = args.title
    if (isInteractive) {
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

    // Create ticket using SDK
    const ticket = await this.sdk.tickets.create({
      title: title.trim(),
      description,
      priority: createTicketPriority(priority),
      type: createTicketType(type),
    })

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
