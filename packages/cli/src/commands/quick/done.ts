import { Args } from '@oclif/core'
import { CompleteTicketRequest } from '@project-manager/core'
import { BaseCommand } from '../../lib/base-command.ts'
import { getCompleteTicketUseCase } from '../../utils/service-factory.ts'

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
    const completeTicketUseCase = getCompleteTicketUseCase()
    const request = new CompleteTicketRequest(args.id)

    await completeTicketUseCase.execute(request)
    this.log(`Completed ticket ${args.id}`)
  }
}
