import { Args } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.ts'

interface ExecuteArgs extends Record<string, unknown> {
  ticketId: string
  priority: string
}

interface ExecuteFlags extends Record<string, unknown> {
  json?: boolean // Inherited from BaseCommand
}

/**
 * Update a ticket's priority
 */
export class UpdatePriorityCommand extends BaseCommand<ExecuteArgs, ExecuteFlags, any> {
  static override description = 'Update ticket priority'

  static override args = {
    ticketId: Args.string({
      description: 'ID of the ticket to update',
      required: true,
    }),
    priority: Args.string({
      description: 'New priority value (high, medium, low)',
      required: true,
    }),
  }

  static override examples = [
    'pm update priority ticket-123 high',
    'pm update priority ticket-456 low',
  ]

  async execute(args: ExecuteArgs, flags: ExecuteFlags): Promise<any | undefined> {
    // Validate required arguments
    if (!args.ticketId) {
      this.error('Ticket ID is required')
    }
    if (!args.priority) {
      this.error('Priority is required')
    }

    // Execute the update operation using SDK
    const updatedTicket = await this.sdk.tickets.updatePriority(args.ticketId, args.priority)

    // Handle JSON output
    if (flags.json) {
      return updatedTicket
    }

    // Display success message
    this.log(`Ticket ${args.ticketId} priority updated to: ${args.priority}`)

    return undefined
  }
}
