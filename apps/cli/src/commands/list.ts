import { Flags } from '@oclif/core'
import type { TicketPriorityKey, TicketStatusKey, TicketTypeKey } from '@project-manager/domain'
import type { SearchTicketsRequest } from '@project-manager/sdk'
import { BaseCommand } from '../lib/base-command.ts'

interface ExecuteFlags {
  status?: TicketStatusKey
  priority?: TicketPriorityKey
  type?: TicketTypeKey
  search?: string
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
      description: 'Filter by status (pending, in_progress, completed, archived)',
      options: ['pending', 'in_progress', 'completed', 'archived'],
    }),
    priority: Flags.string({
      char: 'p',
      description: 'Filter by priority (high, medium, low)',
      options: ['high', 'medium', 'low'],
    }),
    type: Flags.string({
      char: 't',
      description: 'Filter by type (feature, bug, task)',
      options: ['feature', 'bug', 'task'],
    }),
    search: Flags.string({
      description: 'Search tickets by title or description (partial match)',
    }),
    format: Flags.string({
      char: 'f',
      description: 'Output format (table, json, compact)',
      options: ['table', 'json', 'compact'],
      default: 'table',
    }),
  }

  async execute(_args: Record<string, never>, flags: ExecuteFlags): Promise<any[] | undefined> {
    // Build search criteria from flags (remove undefined values)
    const criteria: SearchTicketsRequest = {}

    if (flags.status) criteria.status = flags.status
    if (flags.priority) criteria.priority = flags.priority
    if (flags.type) criteria.type = flags.type
    if (flags.search) criteria.query = flags.search

    // Execute the search using SDK
    const tickets = await this.sdk.tickets.search(criteria)

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
