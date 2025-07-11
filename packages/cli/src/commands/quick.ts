import {
  CreateTicketRequest,
  GetAllTicketsRequest,
  SearchTicketsRequest,
  UpdateTicketStatusRequest,
} from '@project-manager/core'
import { getConfig, isValidTicketStatus } from '@project-manager/shared'
import { Command } from 'commander'
import { expandPriority, expandType } from '../utils/cli-helpers.js'
import { formatTicketSummaryList } from '../utils/output.js'
import {
  getCreateTicketUseCase,
  getGetAllTicketsUseCase,
  getSearchTicketsUseCase,
  getUpdateTicketStatusUseCase,
} from '../utils/service-factory.js'

/**
 * Creates quick commands for frequently used operations
 */
export function createQuickCommands(): Command {
  const quickCommand = new Command('quick')
    .alias('q')
    .description('Quick operations for common tasks')

  // Quick create: minimal input required
  quickCommand
    .command('new')
    .alias('n')
    .description('Quickly create a new ticket')
    .argument('<title>', 'Ticket title')
    .option('-d, --description <description>', 'Ticket description', '')
    .option('-p, --priority <priority>', 'Priority (h=high, m=medium, l=low)', 'm')
    .option('-t, --type <type>', 'Type (f=feature, b=bug, t=task)', 't')
    .action(async (title: string, options) => {
      try {
        const createTicketUseCase = getCreateTicketUseCase()

        // Convert short forms to full values
        const priority = expandPriority(options.priority)
        const type = expandType(options.type)

        const config = getConfig()
        const request = new CreateTicketRequest(
          title.trim(),
          options.description || `Details for: ${title.trim()}`,
          priority,
          type,
          config.defaultPrivacy
        )

        const response = await createTicketUseCase.execute(request)
        console.log(`✓ Created ticket ${response.id}: ${response.title}`)
      } catch (error) {
        console.error(
          'Failed to create ticket:',
          error instanceof Error ? error.message : String(error)
        )
        process.exit(1)
      }
    })

  // Quick status updates
  quickCommand
    .command('start')
    .description('Start working on a ticket (set status to in_progress)')
    .argument('<id>', 'Ticket ID')
    .action(async (id: string) => {
      await updateTicketStatus(id, 'in_progress', 'Started working on')
    })

  quickCommand
    .command('done')
    .description('Mark ticket as completed')
    .argument('<id>', 'Ticket ID')
    .action(async (id: string) => {
      await updateTicketStatus(id, 'completed', 'Completed')
    })

  quickCommand
    .command('archive')
    .description('Archive a ticket')
    .argument('<id>', 'Ticket ID')
    .action(async (id: string) => {
      await updateTicketStatus(id, 'archived', 'Archived')
    })

  // Quick list with common filters
  quickCommand
    .command('todo')
    .description('List pending tickets')
    .option('-c, --compact', 'Compact output format')
    .action(async options => {
      await listTicketsByStatus('pending', options.compact ? 'compact' : 'table')
    })

  quickCommand
    .command('wip')
    .description('List work-in-progress tickets')
    .option('-c, --compact', 'Compact output format')
    .action(async options => {
      await listTicketsByStatus('in_progress', options.compact ? 'compact' : 'table')
    })

  quickCommand
    .command('all')
    .description('List all tickets')
    .option('-c, --compact', 'Compact output format')
    .action(async options => {
      try {
        const getAllTicketsUseCase = getGetAllTicketsUseCase()
        const request = new GetAllTicketsRequest()
        const response = await getAllTicketsUseCase.execute(request)

        const output = formatTicketSummaryList(response.tickets, {
          format: options.compact ? 'compact' : 'table',
        })
        console.log(output)
        console.log(`\nTotal: ${response.tickets.length} tickets`)
      } catch (error) {
        console.error(
          'Failed to list tickets:',
          error instanceof Error ? error.message : String(error)
        )
        process.exit(1)
      }
    })

  return quickCommand
}

/**
 * Helper function to update ticket status
 */
async function updateTicketStatus(id: string, status: string, action: string) {
  try {
    if (!isValidTicketStatus(status)) {
      console.error(
        `Invalid status: ${status}. Valid statuses are: pending, in_progress, completed, archived`
      )
      process.exit(1)
    }

    const updateTicketStatusUseCase = getUpdateTicketStatusUseCase()
    const request = new UpdateTicketStatusRequest(id, status)
    const response = await updateTicketStatusUseCase.execute(request)
    console.log(`✓ ${action} ticket ${response.id}: ${response.title}`)
  } catch (error) {
    console.error(
      `Failed to update ticket:`,
      error instanceof Error ? error.message : String(error)
    )
    process.exit(1)
  }
}

/**
 * Helper function to list tickets by status
 */
async function listTicketsByStatus(status: string, format: 'table' | 'json' | 'compact') {
  try {
    if (!isValidTicketStatus(status)) {
      console.error(
        `Invalid status: ${status}. Valid statuses are: pending, in_progress, completed, archived`
      )
      process.exit(1)
    }

    const searchTicketsUseCase = getSearchTicketsUseCase()
    const request = new SearchTicketsRequest({ status })
    const response = await searchTicketsUseCase.execute(request)

    const output = formatTicketSummaryList(response.tickets, { format })
    console.log(output)
    console.log(`\n${response.tickets.length} ${status} tickets`)
  } catch (error) {
    console.error('Failed to list tickets:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
