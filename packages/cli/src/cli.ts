import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CLI } from '@project-manager/shared'
import { Command } from 'commander'
import { configCommand } from './commands/config.js'
import { createTicketCommand } from './commands/create.js'
import { deleteTicketCommand } from './commands/delete.js'
import { listTicketCommand } from './commands/list.js'
import { createQuickCommands } from './commands/quick.js'
import { showTicketCommand } from './commands/show.js'
import { statsCommand } from './commands/stats.js'
import { updateTicketCommand } from './commands/update.js'
import {
  createTicketAction,
  listAllTicketsAction,
  listTicketsByStatus,
  updateTicketStatus,
} from './utils/cli-helpers.js'

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
      await createTicketAction(title, options)
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
      await listAllTicketsAction(options)
    })
}
