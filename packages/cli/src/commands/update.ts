import { Command } from 'commander'
import { updateTicketAction } from '../utils/cli-helpers.ts'

export function updateTicketCommand(): Command {
  const command = new Command('update')
    .alias('u')
    .description('Update ticket properties')
    .argument('<id>', 'Ticket ID')
    .option('-s, --status <status>', 'Update status (pending, in_progress, completed, archived)')
    .option('-p, --priority <priority>', 'Update priority (high, medium, low)')
    .option('--json', 'Output in JSON format')
    .action(async (id: string, options) => {
      await updateTicketAction(id, {
        status: options.status,
        priority: options.priority,
        json: options.json,
      })
    })

  return command
}
