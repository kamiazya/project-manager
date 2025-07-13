import type { GetTicketStatsUseCase } from '@project-manager/core'
import { GetTicketStatsRequest, TYPES } from '@project-manager/core'
import { BaseCommand } from '../lib/base-command.ts'
import { formatStats } from '../utils/output.ts'

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
    const getTicketStatsUseCase = this.getService<GetTicketStatsUseCase>(
      TYPES.GetTicketStatsUseCase
    )

    // Execute the request
    const request = new GetTicketStatsRequest()
    const response = await getTicketStatsUseCase.execute(request)

    // Output JSON if JSON flag is present, otherwise output formatted text
    if (flags.json) {
      return response.stats
    }

    this.log(formatStats(response.stats))
  }
}
