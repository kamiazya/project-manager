import { GetTicketStats } from '@project-manager/application'
import { BaseCommand } from '../lib/base-command.ts'
import { formatStats } from '../utils/output.ts'
import { getGetTicketStatsUseCase } from '../utils/service-factory.ts'

/**
 * Show ticket statistics
 */
export class StatsCommand extends BaseCommand {
  static override description = 'Show ticket statistics'

  // Leverages oclif's standard JSON flag support.
  // BaseCommand has `enableJsonFlag = true` set,
  // so the --json flag is automatically processed.

  async execute(_args: any, flags: any): Promise<any> {
    // Get the use case from the service container
    const getTicketStatsUseCase = getGetTicketStatsUseCase()

    // Execute the request
    const request = new GetTicketStats.Request()
    const response = await getTicketStatsUseCase.execute(request)

    // Output JSON if JSON flag is present, otherwise output formatted text
    if (flags.json) {
      return response.stats
    }

    this.log(formatStats(response.stats))
  }
}
