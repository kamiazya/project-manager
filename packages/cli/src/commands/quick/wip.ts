import { Flags } from '@oclif/core'
import { SearchTickets } from '@project-manager/core'
import { BaseCommand } from '../../lib/base-command.ts'
import { displayTickets } from '../../lib/table-formatter.ts'
import { getSearchTicketsUseCase } from '../../utils/service-factory.ts'

type ExecuteArgs = Record<string, never>

interface ExecuteFlags {
  compact?: boolean
  json?: boolean // Inherited from BaseCommand
}

/**
 * List work-in-progress tickets
 */
export class QuickWipCommand extends BaseCommand {
  static override description = 'List work-in-progress tickets'

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

  async execute(_args: ExecuteArgs, flags: ExecuteFlags): Promise<void> {
    try {
      const searchTicketsUseCase = getSearchTicketsUseCase()
      const request = new SearchTickets.Request({
        status: 'in_progress',
      })

      const response = await searchTicketsUseCase.execute(request)
      const tickets = response.tickets

      if (tickets.length === 0) {
        this.log('No work-in-progress tickets found.')
        return
      }

      const outputFormat = flags.compact ? 'compact' : 'table'
      displayTickets(tickets, outputFormat, msg => this.log(msg), {
        sectionTitle: 'Work-in-Progress Tickets:',
      })
    } catch (error) {
      if (error instanceof Error) {
        this.error(`Failed to retrieve work-in-progress tickets: ${error.message}`)
      } else {
        this.error('An unexpected error occurred while retrieving tickets')
      }
    }
  }
}
