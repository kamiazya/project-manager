import { Flags } from '@oclif/core'
import { SearchTickets } from '@project-manager/application'
import { BaseCommand } from '../../lib/base-command.ts'
import { displayTickets } from '../../lib/table-formatter.ts'
import { getSearchTicketsUseCase } from '../../utils/service-factory.ts'

/**
 * List all tickets
 */
export class QuickAllCommand extends BaseCommand {
  static override description = 'List all tickets'

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
      const searchTicketsUseCase = getSearchTicketsUseCase()
      const request = new SearchTickets.Request({})

      const response = await searchTicketsUseCase.execute(request)
      const tickets = response.tickets

      if (tickets.length === 0) {
        this.log('No tickets found.')
        return
      }

      const outputFormat = flags.compact ? 'compact' : 'table'
      displayTickets(tickets, outputFormat, msg => this.log(msg), {
        sectionTitle: 'All Tickets:',
        showStatus: true,
        useStatusAbbreviations: true,
      })
    } catch (error) {
      if (error instanceof Error) {
        this.error(`Failed to retrieve tickets: ${error.message}`)
      } else {
        this.error('An unexpected error occurred while retrieving tickets')
      }
    }
  }
}
