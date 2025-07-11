import { GetTicketStatsRequest } from '@project-manager/core'
import { Command } from 'commander'
import { formatStats } from '../utils/output.js'
import { getGetTicketStatsUseCase } from '../utils/service-factory.js'

export function statsCommand(): Command {
  const command = new Command('stats')
    .description('Show ticket statistics')
    .option('--json', 'Output in JSON format')
    .action(async options => {
      try {
        const getTicketStatsUseCase = getGetTicketStatsUseCase()
        const request = new GetTicketStatsRequest()
        const response = await getTicketStatsUseCase.execute(request)

        if (options.json) {
          console.log(JSON.stringify(response.stats, null, 2))
        } else {
          console.log(formatStats(response.stats))
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
