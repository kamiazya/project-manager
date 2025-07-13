import type {
  TicketPriority,
  TicketSearchCriteria,
  TicketStatus,
  TicketType,
} from '@project-manager/shared'
import { getConfig } from '@project-manager/shared'
import { Command } from 'commander'
import { searchTicketsAction } from '../utils/cli-helpers.ts'

export function listTicketCommand(): Command {
  const config = getConfig()

  const command = new Command('list')
    .alias('ls')
    .description('List tickets')
    .option('-s, --status <status>', 'Filter by status (pending, in_progress, completed, archived)')
    .option('-p, --priority <priority>', 'Filter by priority (high, medium, low)')
    .option('-t, --type <type>', 'Filter by type (feature, bug, task)')
    .option('--title <title>', 'Search by title (partial match)')
    .option(
      '-f, --format <format>',
      'Output format (table, json, compact)',
      config.defaultOutputFormat
    )
    .action(async options => {
      const criteria: TicketSearchCriteria = {}

      if (options.status) {
        criteria.status = options.status as TicketStatus
      }
      if (options.priority) {
        criteria.priority = options.priority as TicketPriority
      }
      if (options.type) {
        criteria.type = options.type as TicketType
      }
      if (options.title) {
        criteria.search = options.title
      }

      await searchTicketsAction(criteria, { format: options.format })
    })

  return command
}
