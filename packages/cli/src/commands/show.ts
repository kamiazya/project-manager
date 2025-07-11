import { GetTicketByIdRequest } from '@project-manager/core'
import { Command } from 'commander'
import { formatTicketResponse } from '../utils/output.js'
import { getGetTicketByIdUseCase } from '../utils/service-factory.js'

export function showTicketCommand(): Command {
  const command = new Command('show')
    .description('Show ticket details')
    .argument('<id>', 'Ticket ID')
    .option('--json', 'Output in JSON format')
    .action(async (id: string, options) => {
      try {
        const getTicketByIdUseCase = getGetTicketByIdUseCase()
        const request = new GetTicketByIdRequest(id)
        const response = await getTicketByIdUseCase.execute(request)

        if (!response) {
          console.error(`Ticket not found: ${id}`)
          process.exit(1)
        }

        const output = formatTicketResponse(response, {
          format: options.json ? 'json' : 'table',
        })

        console.log(output)
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          console.error(`Ticket not found: ${id}`)
          process.exit(1)
        }

        console.error(
          'Failed to show ticket:',
          error instanceof Error ? error.message : String(error)
        )
        process.exit(1)
      }
    })

  return command
}
