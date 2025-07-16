import { Flags } from '@oclif/core'
import type { SearchTicketsUseCase } from '@project-manager/core'
import { SearchTicketsRequest, TYPES } from '@project-manager/core'
import { BaseCommand } from '../../lib/base-command.ts'
import { displayTickets } from '../../lib/table-formatter.ts'

/**
 * List pending tickets
 */
export class QuickTodoCommand extends BaseCommand {
  static override description = 'List pending tickets'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --compact',
  ]

  static override flags = {
    compact: Flags.boolean({
      char: 'c',
      description: 'Compact output format',
    }),
  }

  async execute(
    _args: Record<string, never>,
    flags: { compact?: boolean; json?: boolean }
  ): Promise<void> {
    try {
      const searchTicketsUseCase = this.getService<SearchTicketsUseCase>(TYPES.SearchTicketsUseCase)
      const request = new SearchTicketsRequest({
        status: 'pending',
      })

      const response = await searchTicketsUseCase.execute(request)
      const tickets = response.tickets

      if (tickets.length === 0) {
        this.log('No pending tickets found.')
        return
      }

      const outputFormat = flags.compact ? 'compact' : 'table'
      displayTickets(tickets, outputFormat, msg => this.log(msg), {
        sectionTitle: 'Pending Tickets:',
      })
    } catch (error) {
      if (error instanceof Error) {
        this.error(`Failed to retrieve pending tickets: ${error.message}`)
      } else {
        this.error('An unexpected error occurred while retrieving tickets')
      }
    }
  }
}
