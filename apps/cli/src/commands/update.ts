import { Args, Flags } from '@oclif/core'
import {
  createTicketPriority,
  createTicketType,
  type TicketPriorityKey,
  type TicketTypeKey,
} from '@project-manager/domain'
import { BaseCommand } from '../lib/base-command.ts'

interface ExecuteArgs extends Record<string, unknown> {
  ticketId: string
}

interface ExecuteFlags extends Record<string, unknown> {
  title?: string
  description?: string
  priority?: 'high' | 'medium' | 'low'
  type?: 'feature' | 'bug' | 'task'
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
    priority: Flags.string({
      char: 'p',
      description: 'Update ticket priority',
      options: ['high', 'medium', 'low'],
    }),
    type: Flags.string({
      description: 'Update ticket type',
      options: ['feature', 'bug', 'task'],
    }),
  }

  async execute(args: ExecuteArgs, flags: ExecuteFlags): Promise<any | undefined> {
    // Validate required ticket ID
    if (!args.ticketId) {
      this.error('Ticket ID is required')
    }

    // Create update request with only defined fields
    const updates: {
      title?: string
      description?: string
      priority?: TicketPriorityKey
      type?: TicketTypeKey
    } = {}

    if (flags.title !== undefined) updates.title = flags.title
    if (flags.description !== undefined) updates.description = flags.description
    if (flags.priority !== undefined) updates.priority = createTicketPriority(flags.priority)
    if (flags.type !== undefined) updates.type = createTicketType(flags.type)

    // Check if at least one field was provided for update
    const hasUpdates = flags.title || flags.description || flags.priority || flags.type
    if (!hasUpdates) {
      this.error('At least one field must be specified for update')
    }

    // Execute the update operation using SDK
    const updatedTicket = await this.sdk.tickets.update({
      id: args.ticketId,
      ...updates,
    })

    // Note: type updates would need a separate use case if implemented
    if (flags.type !== undefined) {
      this.warn('Type updates are not yet implemented and will be ignored')
    }

    // Handle JSON output
    if (flags.json) {
      return updatedTicket
    }

    // Display success message
    this.log(`Ticket ${args.ticketId} updated successfully.`)

    return undefined
  }
}
