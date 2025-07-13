import { Command } from 'commander'
import { deleteTicketAction } from '../utils/cli-helpers.ts'

export function deleteTicketCommand(): Command {
  const command = new Command('delete')
    .alias('rm')
    .description('Delete a ticket')
    .argument('<id>', 'Ticket ID')
    .option('-f, --force', 'Skip confirmation prompt')
    .action(async (id: string, options) => {
      await deleteTicketAction(id, { force: options.force })
    })

  return command
}
