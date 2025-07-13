import { Command } from 'commander'
import {
  createTicketAction,
  listAllTicketsAction,
  listTicketsByStatus,
  updateTicketStatus,
} from '../utils/cli-helpers.ts'

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
      await createTicketAction(title, options)
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
      await listAllTicketsAction(options)
    })

  return quickCommand
}
