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
export class UpdateContentCommand extends BaseCommand<ExecuteArgs, ExecuteFlags, void> {
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

  async execute(args: ExecuteArgs, flags: ExecuteFlags): Promise<void> {
    // Execute the update operation using SDK
    const updatedTicket = await this.sdk.tickets.updateContent({
      id: args.ticketId,
      title: flags.title,
      description: flags.description,
    })

    // Handle JSON output
    if (flags.json) {
      this.logJson(updatedTicket)
      return
    }

    // Display success message
    const updates: string[] = []
    if (flags.title) updates.push('title')
    if (flags.description) updates.push('description')

    this.log(`Ticket ${args.ticketId} ${updates.join(' and ')} updated successfully.`)
  }
}
