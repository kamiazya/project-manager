import { Args } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.ts'

interface ExecuteArgs extends Record<string, unknown> {
  ticketId: string
  oldAlias: string
  newAlias: string
}

interface ExecuteFlags extends Record<string, unknown> {
  json?: boolean // Inherited from BaseCommand
}

/**
 * Rename custom alias
 */
export class AliasRenameCommand extends BaseCommand<ExecuteArgs, ExecuteFlags, any> {
  static override description = 'Rename a custom alias'

  static override args = {
    ticketId: Args.string({
      description: 'ID or alias of the ticket',
      required: true,
    }),
    oldAlias: Args.string({
      description: 'Current alias name',
      required: true,
    }),
    newAlias: Args.string({
      description: 'New alias name',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.flags,
  }

  static override examples = [
    'pm alias rename 01K12Q9KTAKWKBEV84ZCP4R0EX auth-bug login-bug',
    'pm alias rename ticket-456 old-name new-name',
  ]

  async execute(args: ExecuteArgs, flags: ExecuteFlags): Promise<any> {
    if (!args.ticketId || !args.oldAlias || !args.newAlias) {
      this.error('Ticket ID, old alias, and new alias are all required')
    }

    try {
      await this.sdk.aliases.rename({
        ticketId: args.ticketId,
        oldAlias: args.oldAlias,
        newAlias: args.newAlias,
      })

      if (flags.json) {
        return {
          ticketId: args.ticketId,
          oldAlias: args.oldAlias,
          newAlias: args.newAlias,
          status: 'renamed',
        }
      }

      this.log(
        `Renamed custom alias "${args.oldAlias}" to "${args.newAlias}" for ticket ${args.ticketId}`
      )
      return undefined
    } catch (error: any) {
      this.error(`Failed to rename alias: ${error.message}`)
    }
  }
}
