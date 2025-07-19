import { Args, Flags } from '@oclif/core'
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
    '<%= config.bin %> <%= command.id %> "Add user dashboard" -d "Create user dashboard with analytics" -p high -t feature',
    '<%= config.bin %> <%= command.id %> # Interactive mode',
  ]

  static override args = {
    title: Args.string({
      description: 'Ticket title (optional, will prompt if not provided)',
      required: true,
    }),
  }

  static override flags = {
    description: Flags.string({
      char: 'd',
      description: 'Ticket description',
    }),
    priority: Flags.string({
      char: 'p',
      description: 'Priority: e.g. high, medium, low',
    }),
    type: Flags.string({
      char: 't',
      description: 'Type: e.g. feature, bug, task',
    }),
  }

  async execute(args: ExecuteArgs, flags: ExecuteFlags): Promise<void> {
    const descriptionMatch = trimmed?.match(/^.+?\r?\n([\s\S]+)/)
    const description = descriptionMatch ? descriptionMatch[1]?.trim() : undefined

    // Create ticket using SDK
    const ticket = await this.sdk.tickets.create({
      title: title,
      description: description && description.length > 0 ? description : undefined,
      priority: flags.priority,
      type: flags.type,
      status: '', // Will use default from application layer
    })

    this.log(`Ticket ${ticket.id} created successfully.`)
  }
}
