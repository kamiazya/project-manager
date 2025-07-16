import { Args } from '@oclif/core'
import type { ArchiveTicketUseCase } from '@project-manager/core'
import { ArchiveTicketRequest, TYPES } from '@project-manager/core'
import { BaseCommand } from '../../lib/base-command.ts'

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
    const archiveTicketUseCase = this.getService<ArchiveTicketUseCase>(TYPES.ArchiveTicketUseCase)
    const request = new ArchiveTicketRequest(args.id)

    await archiveTicketUseCase.execute(request)
    this.log(`Archived ticket ${args.id}`)
  }
}
