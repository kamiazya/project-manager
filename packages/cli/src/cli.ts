import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CreateTicketRequest,
  GetAllTicketsRequest,
  SearchTicketsRequest,
  UpdateTicketStatusRequest,
} from '@project-manager/core'
import { CLI, getConfig, isValidTicketStatus } from '@project-manager/shared'
import { Command } from 'commander'
import { configCommand } from './commands/config.js'
import { createTicketCommand } from './commands/create.js'
import { deleteTicketCommand } from './commands/delete.js'
import { listTicketCommand } from './commands/list.js'
import { createQuickCommands } from './commands/quick.js'
import { showTicketCommand } from './commands/show.js'
import { statsCommand } from './commands/stats.js'
import { updateTicketCommand } from './commands/update.js'
import { formatTicketSummaryList } from './utils/output.js'
import {
  getCreateTicketUseCase,
  getGetAllTicketsUseCase,
  getSearchTicketsUseCase,
  getUpdateTicketStatusUseCase,
} from './utils/service-factory.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageJsonPath = join(__dirname, '../package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

export function createCLI(): Command {
  const program = new Command()

  program.name(CLI.COMMAND_NAME).description(CLI.DESCRIPTION).version(packageJson.version)

  // Add core subcommands
  program.addCommand(configCommand())
  program.addCommand(createTicketCommand())
  program.addCommand(listTicketCommand())
  program.addCommand(showTicketCommand())
  program.addCommand(updateTicketCommand())
  program.addCommand(deleteTicketCommand())
  program.addCommand(statsCommand())

  // Add convenient shortcuts for common operations
  program.addCommand(createQuickCommands())

  // Add top-level aliases for the most common operations
  addTopLevelAliases(program)

  return program
}

/**
 * Add top-level aliases for the most common operations
 */
function addTopLevelAliases(program: Command): void {
  // Add top-level aliases for most common operations
  program
    .command('new')
    .alias('n')
    .description('Create a new ticket')
    .argument('<title>', 'Ticket title')
    .option('-d, --description <description>', 'Ticket description', '')
    .option('-p, --priority <priority>', 'Priority (h=high, m=medium, l=low)', 'm')
    .option('-t, --type <type>', 'Type (f=feature, b=bug, t=task)', 't')
    .action(async (title: string, options) => {
      try {
        const createTicketUseCase = getCreateTicketUseCase()
        const config = getConfig()

        // Convert short forms to full values
        const priority = expandPriority(options.priority)
        const type = expandType(options.type)

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

  program
    .command('todo')
    .alias('t')
    .description('List pending tickets')
    .option('-c, --compact', 'Compact output format')
    .action(async options => {
      await listTicketsByStatus('pending', options.compact ? 'compact' : 'table')
    })

  program
    .command('wip')
    .alias('w')
    .description('List work-in-progress tickets')
    .option('-c, --compact', 'Compact output format')
    .action(async options => {
      await listTicketsByStatus('in_progress', options.compact ? 'compact' : 'table')
    })

  program
    .command('start')
    .alias('s')
    .description('Start working on a ticket')
    .argument('<id>', 'Ticket ID')
    .action(async (id: string) => {
      await updateTicketStatus(id, 'in_progress', 'Started working on')
    })

  program
    .command('done')
    .alias('d')
    .description('Mark ticket as completed')
    .argument('<id>', 'Ticket ID')
    .action(async (id: string) => {
      await updateTicketStatus(id, 'completed', 'Completed')
    })

  program
    .command('all')
    .alias('a')
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

/**
 * Expand priority short forms
 */
function expandPriority(short: string): 'high' | 'medium' | 'low' {
  switch (short.toLowerCase()) {
    case 'h':
    case 'high':
      return 'high'
    case 'l':
    case 'low':
      return 'low'
    case 'm':
    case 'medium':
      return 'medium'
    default:
      return 'medium'
  }
}

/**
 * Expand type short forms
 */
function expandType(short: string): 'feature' | 'bug' | 'task' {
  switch (short.toLowerCase()) {
    case 'f':
    case 'feature':
      return 'feature'
    case 'b':
    case 'bug':
      return 'bug'
    case 't':
    case 'task':
      return 'task'
    default:
      return 'task'
  }
}
