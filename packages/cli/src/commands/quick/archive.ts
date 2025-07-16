import { Args } from '@oclif/core'
import { ArchiveTicketRequest } from '@project-manager/core'
import { BaseCommand } from '../../lib/base-command.ts'
import { getArchiveTicketUseCase } from '../../utils/service-factory.ts'

/**
 * Archive a ticket
 */
export class QuickArchiveCommand extends BaseCommand {
  static override description = 'Archive a ticket'

  static override examples = ['<%= config.bin %> <%= command.id %> abc123']

  static override args = {
    id: Args.string({
      description: 'Ticket ID',
      required: true,
    }),
  }

  async execute(args: { id: string }): Promise<any> {
    const archiveTicketUseCase = getArchiveTicketUseCase()
    const request = new ArchiveTicketRequest(args.id)

    await archiveTicketUseCase.execute(request)
    this.log(`Archived ticket ${args.id}`)
  }
}
