import { Args, Flags } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.ts'

interface ExecuteArgs extends Record<string, unknown> {
  ticketId: string
}

interface ExecuteFlags extends Record<string, unknown> {
  title?: string
  description?: string
  json?: boolean // Inherited from BaseCommand
}

/**
 * Update a ticket's content (title and description)
 */
export class UpdateContentCommand extends BaseCommand<ExecuteArgs, ExecuteFlags, any> {
  static override description = 'Update ticket content (title and description)'

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

  static override examples = [
    'pm update content ticket-123 --title "New title"',
    'pm update content ticket-456 --description "Updated description"',
    'pm update content ticket-789 -t "Bug fix" -d "Fixed the login issue"',
  ]

  async execute(args: ExecuteArgs, flags: ExecuteFlags): Promise<any | undefined> {
    // Validate required ticket ID
    if (!args.ticketId) {
      this.error('Ticket ID is required')
    }

    // Ensure at least one update flag is provided
    if (!flags.title && !flags.description) {
      this.error('At least one of --title or --description must be provided')
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
    const updates: string[] = []
    if (flags.title) updates.push('title')
    if (flags.description) updates.push('description')

    this.log(`Ticket ${args.ticketId} ${updates.join(' and ')} updated successfully.`)

    return undefined
  }
}
