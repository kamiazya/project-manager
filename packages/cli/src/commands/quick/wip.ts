import { Flags } from '@oclif/core'
import type { SearchTicketsUseCase } from '@project-manager/core'
import { SearchTicketsRequest, TYPES } from '@project-manager/core'
import { BaseCommand } from '../../lib/base-command.ts'

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

  async execute(_args: any, flags: any): Promise<any> {
    const searchTicketsUseCase = this.getService<SearchTicketsUseCase>(TYPES.SearchTicketsUseCase)
    const request = new SearchTicketsRequest({
      status: 'in_progress',
      priority: undefined,
      type: undefined,
      privacy: undefined,
      search: undefined,
    })

    const response = await searchTicketsUseCase.execute(request)
    const tickets = response.tickets

    if (tickets.length === 0) {
      this.log('No work-in-progress tickets found.')
      return
    }

    const outputFormat = flags.compact ? 'compact' : 'table'
    this.displayTickets(tickets, outputFormat)
  }

  private displayTickets(tickets: any[], format: string): void {
    if (format === 'compact') {
      tickets.forEach(ticket => {
        const priority = ticket.priority.charAt(0).toUpperCase()
        const type = ticket.type.charAt(0).toUpperCase()
        this.log(`${ticket.id} [${priority}${type}] ${ticket.title}`)
      })
    } else {
      // Table format
      const headers = ['ID', 'Title', 'Priority', 'Type', 'Created']
      const rows = tickets.map(ticket => [
        ticket.id,
        ticket.title.length > 50 ? ticket.title.substring(0, 47) + '...' : ticket.title,
        ticket.priority,
        ticket.type,
        new Date(ticket.createdAt).toLocaleDateString(),
      ])

      this.log('\nWork-in-Progress Tickets:')
      this.log('=========================')
      this.log(this.formatTable(headers, rows))
    }
  }

  private formatTable(headers: string[], rows: string[][]): string {
    const colWidths = headers.map((header, i) =>
      Math.max(header.length, ...rows.map(row => row[i].length))
    )

    const headerRow = headers.map((header, i) => header.padEnd(colWidths[i])).join(' | ')

    const separator = colWidths.map(width => '-'.repeat(width)).join('-|-')

    const dataRows = rows.map(row => row.map((cell, i) => cell.padEnd(colWidths[i])).join(' | '))

    return [headerRow, separator, ...dataRows].join('\n')
  }
}
