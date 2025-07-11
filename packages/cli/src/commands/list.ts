import type {
  TicketPriority,
  TicketSearchCriteria,
  TicketStatus,
  TicketType,
} from '@project-manager/shared'
import { DEFAULTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@project-manager/shared'
import { Command } from 'commander'
import { formatTicketList } from '../utils/output.js'
import { getTicketUseCase } from '../utils/service-factory.js'

export function listTicketCommand(): Command {
  const command = new Command('list')
    .alias('ls')
    .description('List tickets')
    .option('-s, --status <status>', 'Filter by status (pending, in_progress, completed, archived)')
    .option('-p, --priority <priority>', 'Filter by priority (high, medium, low)')
    .option('-t, --type <type>', 'Filter by type (feature, bug, task)')
    .option('--title <title>', 'Search by title (partial match)')
    .option('-f, --format <format>', 'Output format (table, json, compact)', DEFAULTS.OUTPUT_FORMAT)
    .action(async options => {
      try {
        const ticketUseCase = getTicketUseCase()

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

        const tickets = await ticketUseCase.searchTickets(criteria)

        const output = formatTicketList(tickets, { format: options.format })
        console.log(output)

        if (tickets.length > 0) {
          console.log(`\n${SUCCESS_MESSAGES.TICKETS_FOUND(tickets.length)}`)
        }
      } catch (error) {
        console.error(
          ERROR_MESSAGES.OPERATION_FAILED.LIST,
          error instanceof Error ? error.message : String(error)
        )
        process.exit(1)
      }
    })

  return command
}
