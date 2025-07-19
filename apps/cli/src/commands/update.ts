import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../lib/base-command.ts'

interface ExecuteArgs extends Record<string, unknown> {
  ticketId: string
}

interface ExecuteFlags extends Record<string, unknown> {
  title?: string
  description?: string
  json?: boolean // Inherited from BaseCommand
}

/**
 * Update a ticket's properties
 */
export class UpdateCommand extends BaseCommand<ExecuteArgs, ExecuteFlags, any> {
  static override description = 'Update ticket properties'
  static override aliases = ['u']

  static override args = {
    ticketId: Args.string({
      description: 'ID of the ticket to update',
      required: true,
    }),
  }

  static override flags = {
    title: Flags.string({
      char: 't',
      description: 'Update ticket title',
    }),
    description: Flags.string({
      char: 'd',
      description: 'Update ticket description',
    }),
  }

  async execute(args: ExecuteArgs, flags: ExecuteFlags): Promise<any | undefined> {
    // Validate required ticket ID
    if (!args.ticketId) {
      this.error('Ticket ID is required')
    }

    // Execute the update operation using SDK
    const updatedTicket = await this.sdk.tickets.updateContent({
      id: args.ticketId,
      title: flags.title,
      description: flags.description,
    })

    // Handle JSON output
    if (flags.json) {
      return updatedTicket
    }

    // Display success message
    this.log(`Ticket ${args.ticketId} updated successfully.`)

    return undefined
  }
}
