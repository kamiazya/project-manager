import { Args } from '@oclif/core'
import type { TicketResponse } from '@project-manager/sdk'
import { BaseCommand } from '../lib/base-command.ts'

interface ExecuteArgs extends Record<string, unknown> {
  ticketId: string
}

interface ExecuteFlags extends Record<string, unknown> {
  json?: boolean // Inherited from BaseCommand
}

/**
 * Show details of a single ticket
 */
export class ShowCommand extends BaseCommand<
  ExecuteArgs,
  ExecuteFlags,
  TicketResponse | undefined
> {
  static override description = 'Show ticket details'

  static override args = {
    ticketId: Args.string({
      description: 'ID or alias of the ticket to show',
      required: true,
    }),
  }

  async execute(args: ExecuteArgs, flags: ExecuteFlags): Promise<TicketResponse | undefined> {
    if (!args.ticketId) {
      this.error('Ticket ID is required')
    }

    // Get ticket using SDK
    const ticket = await this.sdk.tickets.getById(args.ticketId)

    // Handle ticket not found
    if (!ticket) {
      this.error(`Ticket not found: ${args.ticketId}`)
    }

    // Handle JSON output
    if (flags.json) {
      return ticket
    }

    // Format and display the ticket
    const output = `ID: ${ticket.id}\nTitle: ${ticket.title}\nStatus: ${ticket.status}\nPriority: ${ticket.priority}\nType: ${ticket.type}\nDescription: ${ticket.description}\nCreated: ${ticket.createdAt}\nUpdated: ${ticket.updatedAt}`
    this.log(output)

    return undefined
  }
}
