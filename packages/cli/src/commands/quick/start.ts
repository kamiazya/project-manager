import { Args } from '@oclif/core'
import type { StartTicketProgressUseCase } from '@project-manager/core'
import { StartTicketProgressRequest, TYPES } from '@project-manager/core'
import { BaseCommand } from '../../lib/base-command.ts'

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
    const startTicketProgressUseCase = this.getService<StartTicketProgressUseCase>(
      TYPES.StartTicketProgressUseCase
    )
    const request = new StartTicketProgressRequest(args.id)

    await startTicketProgressUseCase.execute(request)
    this.log(`Started working on ticket ${args.id}`)
  }
}
