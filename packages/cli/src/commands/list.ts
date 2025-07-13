import { Flags } from '@oclif/core'
import type { SearchTicketsUseCase } from '@project-manager/core'
import { SearchTicketsRequest, TYPES } from '@project-manager/core'
import type { TicketSearchCriteria } from '@project-manager/shared'
import { SUCCESS_MESSAGES } from '@project-manager/shared'
import { BaseCommand } from '../lib/base-command.ts'
import { formatTicketSummaryList } from '../utils/output.ts'

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
    title: Flags.string({
      description: 'Search by title (partial match)',
    }),
    format: Flags.string({
      char: 'f',
      description: 'Output format (table, json, compact)',
      options: ['table', 'json', 'compact'],
      default: 'table',
    }),
  }

  async execute(_args: any, flags: any): Promise<any> {
    // Build search criteria from flags (remove undefined values)
    const criteria: TicketSearchCriteria = {}

    if (flags.status) criteria.status = flags.status
    if (flags.priority) criteria.priority = flags.priority
    if (flags.type) criteria.type = flags.type
    if (flags.title) criteria.search = flags.title

    // Get the use case from the service container
    const searchTicketsUseCase = this.getService<SearchTicketsUseCase>(TYPES.SearchTicketsUseCase)

    // Execute the request
    const request = new SearchTicketsRequest(criteria)
    const response = await searchTicketsUseCase.execute(request)

    // Handle JSON output
    if (flags.json) {
      return response.tickets
    }

    // Format and display results
    const output = formatTicketSummaryList(response.tickets, {
      format: flags.format,
    })
    this.log(output)

    // Show summary message
    if (response.tickets.length > 0) {
      this.log(`\n${SUCCESS_MESSAGES.TICKETS_FOUND(response.tickets.length)}`)
    }
  }
}
