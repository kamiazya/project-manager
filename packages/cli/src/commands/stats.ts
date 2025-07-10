import { Command } from 'commander'
import { formatStats } from '../utils/output.js'
import { getTicketUseCase } from '../utils/service-factory.js'

export function statsCommand(): Command {
  const command = new Command('stats')
    .description('Show ticket statistics')
    .option('--json', 'Output in JSON format')
    .action(async options => {
      try {
        const ticketUseCase = getTicketUseCase()
        const stats = await ticketUseCase.getTicketStats()

        if (options.json) {
          console.log(JSON.stringify(stats, null, 2))
        } else {
          console.log(formatStats(stats))
        }
      } catch (error) {
        console.error(
          'Failed to get stats:',
          error instanceof Error ? error.message : String(error)
        )
        process.exit(1)
      }
    })

  return command
}
