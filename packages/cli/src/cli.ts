import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CLI } from '@project-manager/shared'
import { Command } from 'commander'
import { createTicketCommand } from './commands/create.js'
import { deleteTicketCommand } from './commands/delete.js'
import { listTicketCommand } from './commands/list.js'
import { showTicketCommand } from './commands/show.js'
import { statsCommand } from './commands/stats.js'
import { updateTicketCommand } from './commands/update.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageJsonPath = join(__dirname, '../package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

export function createCLI(): Command {
  const program = new Command()

  program.name(CLI.COMMAND_NAME).description(CLI.DESCRIPTION).version(packageJson.version)

  // Add subcommands
  program.addCommand(createTicketCommand())
  program.addCommand(listTicketCommand())
  program.addCommand(showTicketCommand())
  program.addCommand(updateTicketCommand())
  program.addCommand(deleteTicketCommand())
  program.addCommand(statsCommand())

  return program
}
