import { confirm } from '@inquirer/prompts'
import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../lib/base-command.ts'

interface ExecuteFlags {
  force?: boolean
  json?: boolean
}

/**
 * Delete a ticket
 */
export class DeleteCommand extends BaseCommand {
  static override description = 'Delete a ticket'
  static override aliases = ['rm']

  static override args = {
    ticketId: Args.string({
      description: 'ID or alias of the ticket to delete',
      required: true,
    }),
  }

  static override flags = {
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
    }),
  }

  async execute(args: { ticketId: string }, flags: ExecuteFlags): Promise<void> {
    // First, verify the ticket exists
    const ticket = await this.sdk.tickets.getById(args.ticketId)

    // Handle ticket not found
    if (!ticket) {
      this.error(`Ticket not found: ${args.ticketId}`)
    }

    // Show confirmation unless force flag is used
    if (!flags.force) {
      const confirmed = await confirm({
        message: `Are you sure you want to delete ticket "${ticket.title}"?`,
        default: false,
      })
      if (!confirmed) {
        this.log('Deletion cancelled.')
        return
      }
    }

    // Delete the ticket
    await this.sdk.tickets.delete(args.ticketId)

    this.log(`Ticket ${args.ticketId} deleted successfully.`)
  }
}
