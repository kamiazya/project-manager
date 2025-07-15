import { Args } from '@oclif/core'
import type { GetTicketByIdResponse, GetTicketByIdUseCase } from '@project-manager/core'
import { GetTicketByIdRequest, TYPES } from '@project-manager/core'
import { BaseCommand } from '../lib/base-command.ts'
import { formatTicketResponse } from '../utils/output.ts'

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
  GetTicketByIdResponse | undefined
> {
  static override description = 'Show ticket details'

  static override args = {
    ticketId: Args.string({
      description: 'ID of the ticket to show',
      required: true,
    }),
  }

  async execute(
    args: ExecuteArgs,
    flags: ExecuteFlags
  ): Promise<GetTicketByIdResponse | undefined> {
    if (!args.ticketId) {
      this.error('Ticket ID is required')
    }

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

    return undefined
  }
}
