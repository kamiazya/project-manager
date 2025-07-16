import { Args } from '@oclif/core'
import { StartTicketProgress } from '@project-manager/core'
import { BaseCommand } from '../../lib/base-command.ts'
import { getStartTicketProgressUseCase } from '../../utils/service-factory.ts'

/**
 * Start working on a ticket (set status to in_progress)
 */
export class QuickStartCommand extends BaseCommand {
  static override description = 'Start working on a ticket (set status to in_progress)'

  static override examples = ['<%= config.bin %> <%= command.id %> abc123']

  static override args = {
    id: Args.string({
      description: 'Ticket ID',
      required: true,
    }),
  }

  async execute(args: { id: string }): Promise<any> {
    const startTicketProgressUseCase = getStartTicketProgressUseCase()
    const request = new StartTicketProgress.Request(args.id)

    await startTicketProgressUseCase.execute(request)
    this.log(`Started working on ticket ${args.id}`)
  }
}
