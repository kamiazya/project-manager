import { Args } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.ts'

interface ExecuteArgs extends Record<string, unknown> {
  ticketId: string
  status: string
}

interface ExecuteFlags extends Record<string, unknown> {
  json?: boolean // Inherited from BaseCommand
}

/**
 * Update a ticket's status
 */
export class UpdateStatusCommand extends BaseCommand<ExecuteArgs, ExecuteFlags, any> {
  static override description = 'Update ticket status'

  static override args = {
    ticketId: Args.string({
      description: 'ID or alias of the ticket to update',
      required: true,
    }),
    status: Args.string({
      description: 'New status value (pending, in_progress, completed, archived)',
      required: true,
    }),
  }

  static override examples = [
    'pm update status ticket-123 in_progress',
    'pm update status ticket-456 completed',
  ]

  async execute(args: ExecuteArgs, flags: ExecuteFlags): Promise<any | undefined> {
    // Validate required arguments
    if (!args.ticketId) {
      this.error('Ticket ID is required')
    }
    if (!args.status) {
      this.error('Status is required')
    }

    // Execute the update operation using SDK
    const updatedTicket = await this.sdk.tickets.updateStatus(args.ticketId, args.status)

    // Handle JSON output
    if (flags.json) {
      return updatedTicket
    }

    // Display success message
    this.log(`Ticket ${args.ticketId} status updated to: ${args.status}`)

    return undefined
  }
}
