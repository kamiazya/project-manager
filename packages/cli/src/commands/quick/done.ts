import { Args } from '@oclif/core'
import type { CompleteTicketUseCase } from '@project-manager/core'
import { CompleteTicketRequest, TYPES } from '@project-manager/core'
import { BaseCommand } from '../../lib/base-command.ts'

/**
 * Mark ticket as completed
 */
export class QuickDoneCommand extends BaseCommand {
  static override description = 'Mark ticket as completed'

  static override examples = ['<%= config.bin %> <%= command.id %> abc123']

  static override args = {
    id: Args.string({
      description: 'Ticket ID',
      required: true,
    }),
  }

  async execute(args: { id: string }): Promise<any> {
    const completeTicketUseCase = this.getService<CompleteTicketUseCase>(
      TYPES.CompleteTicketUseCase
    )
    const request = new CompleteTicketRequest(args.id)

    await completeTicketUseCase.execute(request)
    this.log(`Completed ticket ${args.id}`)
  }
}
