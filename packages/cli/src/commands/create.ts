import type { TicketPriority, TicketPrivacy, TicketType } from '@project-manager/shared'
import { getConfig } from '@project-manager/shared'
import { Command } from 'commander'
import { createDetailedTicketAction } from '../utils/cli-helpers.js'

export function createTicketCommand(): Command {
  const config = getConfig()

  const command = new Command('create')
    .alias('c')
    .description('Create a new ticket')
    .argument('<title>', 'Ticket title')
    .argument('<description>', 'Ticket description')
    .option(
      '-p, --priority <priority>',
      'Priority level (high, medium, low)',
      config.defaultPriority
    )
    .option('-t, --type <type>', 'Ticket type (feature, bug, task)', config.defaultType)
    .option(
      '--privacy <privacy>',
      'Privacy level (local-only, shareable, public)',
      config.defaultPrivacy
    )
    .option('-s, --status <status>', 'Initial status (pending, in_progress)', config.defaultStatus)
    .option('--json', 'Output in JSON format')
    .action(async (title: string, description: string, options) => {
      await createDetailedTicketAction(title, description, {
        priority: options.priority as TicketPriority,
        type: options.type as TicketType,
        privacy: options.privacy as TicketPrivacy,
        json: options.json,
      })
    })

  return command
}
