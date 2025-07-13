import { Args } from '@oclif/core'
import type { GetTicketByIdUseCase } from '@project-manager/core'
import { GetTicketByIdRequest, TYPES } from '@project-manager/core'
import { BaseCommand } from '../lib/base-command.ts'
import { formatTicketResponse } from '../utils/output.ts'

/**
 * Show details of a single ticket
 */
export class ShowCommand extends BaseCommand {
  static override description = 'Show ticket details'

  static override args = {
    ticketId: Args.string({
      description: 'ID of the ticket to show',
      required: true,
    }),
  }

  async execute(args: { ticketId: string }, flags: any): Promise<any> {
    // Get the use case from the service container
    const getTicketByIdUseCase = this.getService<GetTicketByIdUseCase>(TYPES.GetTicketByIdUseCase)

    // Execute the request
    const request = new GetTicketByIdRequest(args.ticketId)
    const response = await getTicketByIdUseCase.execute(request)

    // Handle ticket not found
    if (!response) {
      this.error(`Ticket not found: ${args.ticketId}`)
    }

    // Handle JSON output
    if (flags.json) {
      return response
    }

    // Format and display the ticket
    const output = formatTicketResponse(response, { format: 'table' })
    this.log(output)
  }
}
