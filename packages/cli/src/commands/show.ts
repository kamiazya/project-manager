import { Args } from '@oclif/core'
import { type GetTicketById, GetTicketByIdRequest } from '@project-manager/core'
import { BaseCommand } from '../lib/base-command.ts'
import { formatTicketResponse } from '../utils/output.ts'
import { getGetTicketByIdUseCase } from '../utils/service-factory.ts'

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
  GetTicketById.Response | undefined
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
  ): Promise<GetTicketById.Response | undefined> {
    if (!args.ticketId) {
      this.error('Ticket ID is required')
    }

    // Get the use case from the service container
    const getTicketByIdUseCase = getGetTicketByIdUseCase()

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
