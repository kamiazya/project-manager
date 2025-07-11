import { DeleteTicketRequest, GetTicketByIdRequest } from '@project-manager/core'
import { Command } from 'commander'
import { getDeleteTicketUseCase, getGetTicketByIdUseCase } from '../utils/service-factory.js'

export function deleteTicketCommand(): Command {
  const command = new Command('delete')
    .alias('rm')
    .description('Delete a ticket')
    .argument('<id>', 'Ticket ID')
    .option('-f, --force', 'Skip confirmation prompt')
    .action(async (id: string, options) => {
      try {
        const getTicketByIdUseCase = getGetTicketByIdUseCase()
        const deleteTicketUseCase = getDeleteTicketUseCase()

        // Verify ticket exists
        const getRequest = new GetTicketByIdRequest(id)
        const response = await getTicketByIdUseCase.execute(getRequest)
        if (!response) {
          console.error(`Ticket not found: ${id}`)
          process.exit(1)
        }

        // Show confirmation unless force flag is used
        if (!options.force) {
          console.log(`About to delete ticket: ${response.title}`)
          console.log('Use --force flag to skip this confirmation.')
          process.exit(0)
        }

        const deleteRequest = new DeleteTicketRequest(id)
        await deleteTicketUseCase.execute(deleteRequest)
        console.log(`Ticket ${id} deleted successfully.`)
      } catch (error) {
        console.error(
          'Failed to delete ticket:',
          error instanceof Error ? error.message : String(error)
        )
        process.exit(1)
      }
    })

  return command
}
