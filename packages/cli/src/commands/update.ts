import { Args, Flags } from '@oclif/core'
import type { UpdateTicketResponse } from '@project-manager/core'
import { UpdateTicketRequest } from '@project-manager/core'
import { BaseCommand } from '../lib/base-command.ts'
import { getUpdateTicketUseCase } from '../utils/service-factory.ts'

interface ExecuteArgs extends Record<string, unknown> {
  ticketId: string
}

interface ExecuteFlags extends Record<string, unknown> {
  title?: string
  description?: string
  status?: 'pending' | 'in_progress' | 'completed' | 'archived'
  priority?: 'high' | 'medium' | 'low'
  type?: 'feature' | 'bug' | 'task'
  json?: boolean // Inherited from BaseCommand
}

/**
 * Update a ticket's properties
 */
export class UpdateCommand extends BaseCommand<ExecuteArgs, ExecuteFlags, UpdateTicketResponse> {
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
    status: Flags.string({
      char: 's',
      description: 'Update ticket status',
      options: ['pending', 'in_progress', 'completed', 'archived'],
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

  async execute(args: ExecuteArgs, flags: ExecuteFlags): Promise<UpdateTicketResponse | undefined> {
    // Validate required ticket ID
    if (!args.ticketId) {
      this.error('Ticket ID is required')
    }

    // Get the use case from the service container
    const updateTicketUseCase = getUpdateTicketUseCase()

    // Create update request with all provided fields
    const updateRequest = new UpdateTicketRequest(args.ticketId, {
      title: flags.title,
      description: flags.description,
      status: flags.status,
      priority: flags.priority,
      type: flags.type,
    })

    // Check if at least one field was provided for update
    const hasUpdates =
      flags.title || flags.description || flags.status || flags.priority || flags.type
    if (!hasUpdates) {
      this.error('At least one field must be specified for update')
    }

    // Execute the update operation (single I/O operation)
    const updatedTicket = await updateTicketUseCase.execute(updateRequest)

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
