import { Command } from 'commander'
import { getTicketUseCase } from '../utils/service-factory.js'

export function deleteTicketCommand(): Command {
  const command = new Command('delete')
    .alias('rm')
    .description('Delete a ticket')
    .argument('<id>', 'Ticket ID')
    .option('-f, --force', 'Skip confirmation prompt')
    .action(async (id: string, options) => {
      try {
        const ticketUseCase = getTicketUseCase()

        // Verify ticket exists
        let ticket: any
        try {
          ticket = await ticketUseCase.getTicket(id)
        } catch (error) {
          if (error instanceof Error && error.message.includes('not found')) {
            console.error(`Ticket not found: ${id}`)
            process.exit(1)
          }
          throw error
        }

        // Show confirmation unless force flag is used
        if (!options.force) {
          console.log(`About to delete ticket: ${ticket.title}`)
          console.log('Use --force flag to skip this confirmation.')
          process.exit(0)
        }

        await ticketUseCase.deleteTicket(id)
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
