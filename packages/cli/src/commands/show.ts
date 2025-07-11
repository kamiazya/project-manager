import { Command } from 'commander'
import { showTicketAction } from '../utils/cli-helpers.js'

export function showTicketCommand(): Command {
  const command = new Command('show')
    .description('Show ticket details')
    .argument('<id>', 'Ticket ID')
    .option('--json', 'Output in JSON format')
    .action(async (id: string, options) => {
      await showTicketAction(id, { json: options.json })
    })

  return command
}
