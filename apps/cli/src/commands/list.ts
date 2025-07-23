import { Flags } from '@oclif/core'
import type { TicketPriorityKey, TicketStatusKey, TicketTypeKey } from '@project-manager/domain'
import { BaseCommand } from '../lib/base-command.ts'

interface ExecuteFlags {
  status?: TicketStatusKey
  priority?: TicketPriorityKey
  type?: TicketTypeKey
  query?: string
  format?: 'table' | 'json' | 'compact'
  json?: boolean
}

/**
 * List tickets with optional filtering
 */
export class ListCommand extends BaseCommand {
  static override description = 'List tickets'
  static override aliases = ['ls']

  static override flags = {
    status: Flags.string({
      char: 's',
      description: 'Filter by status (e,g, pending, in_progress, completed, archived)',
    }),
    priority: Flags.string({
      char: 'p',
      description: 'Filter by priority (e.g. high, medium, low)',
      options: ['high', 'medium', 'low'],
    }),
    type: Flags.string({
      char: 't',
      description: 'Filter by type (e.g. feature, bug, task)',
    }),
    query: Flags.string({
      description: 'Search query to filter tickets by title or description',
      char: 'q',
    }),
    format: Flags.string({
      char: 'f',
      description: 'Output format (table, json, compact)',
      options: ['table', 'json', 'compact'],
      default: 'table',
    }),
  }

  async execute(_args: Record<string, never>, flags: ExecuteFlags): Promise<any[] | undefined> {
    // Execute the search using SDK
    const tickets = await this.sdk.tickets.search({
      status: flags.status,
      priority: flags.priority,
      type: flags.type,
      query: flags.query,
    })

    // Handle JSON output
    if (flags.json) {
      return tickets
    }

    // Format and display results
    const output = tickets
      .map(ticket => `${ticket.id}: ${ticket.title} [${ticket.status}]`)
      .join('\n')
    this.log(output)

    // Show summary message
    if (tickets.length > 0) {
      this.log(`\nFound${tickets.length} ticket(s)`)
    }

    return undefined
  }
}
