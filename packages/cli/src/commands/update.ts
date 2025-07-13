import { Args, Flags } from '@oclif/core'
import type {
  GetTicketByIdUseCase,
  UpdateTicketDescriptionUseCase,
  UpdateTicketPriorityUseCase,
  UpdateTicketStatusUseCase,
  UpdateTicketTitleUseCase,
} from '@project-manager/core'
import {
  GetTicketByIdRequest,
  TYPES,
  UpdateTicketDescriptionRequest,
  UpdateTicketPriorityRequest,
  UpdateTicketStatusRequest,
  UpdateTicketTitleRequest,
} from '@project-manager/core'
import { BaseCommand } from '../lib/base-command.ts'

/**
 * Update a ticket's properties
 */
export class UpdateCommand extends BaseCommand {
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

  async execute(args: { ticketId: string }, flags: any): Promise<any> {
    // Get the use cases from the service container
    const getTicketByIdUseCase = this.getService<GetTicketByIdUseCase>(TYPES.GetTicketByIdUseCase)

    // First, verify the ticket exists
    const getRequest = new GetTicketByIdRequest(args.ticketId)
    const ticket = await getTicketByIdUseCase.execute(getRequest)

    // Handle ticket not found
    if (!ticket) {
      this.error(`Ticket not found: ${args.ticketId}`)
    }

    // Check if at least one field was provided for update
    const hasUpdates =
      flags.title !== undefined ||
      flags.description !== undefined ||
      flags.status !== undefined ||
      flags.priority !== undefined ||
      flags.type !== undefined

    if (!hasUpdates) {
      this.error('At least one field must be specified for update')
    }

    let updatedTicket = ticket

    // Update title if provided
    if (flags.title !== undefined) {
      const updateTitleUseCase = this.getService<UpdateTicketTitleUseCase>(
        TYPES.UpdateTicketTitleUseCase
      )
      const titleRequest = new UpdateTicketTitleRequest(args.ticketId, flags.title)
      const titleResponse = await updateTitleUseCase.execute(titleRequest)
      updatedTicket = titleResponse
    }

    // Update description if provided
    if (flags.description !== undefined) {
      const updateDescriptionUseCase = this.getService<UpdateTicketDescriptionUseCase>(
        TYPES.UpdateTicketDescriptionUseCase
      )
      const descriptionRequest = new UpdateTicketDescriptionRequest(
        args.ticketId,
        flags.description
      )
      const descriptionResponse = await updateDescriptionUseCase.execute(descriptionRequest)
      updatedTicket = descriptionResponse
    }

    // Update status if provided
    if (flags.status !== undefined) {
      const updateStatusUseCase = this.getService<UpdateTicketStatusUseCase>(
        TYPES.UpdateTicketStatusUseCase
      )
      const statusRequest = new UpdateTicketStatusRequest(args.ticketId, flags.status)
      const statusResponse = await updateStatusUseCase.execute(statusRequest)
      updatedTicket = statusResponse
    }

    // Update priority if provided
    if (flags.priority !== undefined) {
      const updatePriorityUseCase = this.getService<UpdateTicketPriorityUseCase>(
        TYPES.UpdateTicketPriorityUseCase
      )
      const priorityRequest = new UpdateTicketPriorityRequest(args.ticketId, flags.priority)
      const priorityResponse = await updatePriorityUseCase.execute(priorityRequest)
      updatedTicket = priorityResponse
    }

    // Note: type updates would need a separate use case if implemented
    if (flags.type !== undefined) {
      // For now, we'll warn that type updates aren't implemented
      this.warn('Type updates are not yet implemented')
    }

    // Handle JSON output
    if (flags.json) {
      return updatedTicket
    }

    // Display success message
    this.log(`Ticket ${args.ticketId} updated successfully.`)
  }
}
