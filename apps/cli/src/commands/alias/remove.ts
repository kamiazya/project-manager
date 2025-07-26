import { Args } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.ts'

interface ExecuteArgs extends Record<string, unknown> {
  ticketId: string
  alias: string
}

interface ExecuteFlags extends Record<string, unknown> {
  json?: boolean // Inherited from BaseCommand
}

/**
 * Remove custom alias from ticket
 */
export class AliasRemoveCommand extends BaseCommand<ExecuteArgs, ExecuteFlags, any> {
  static override description = 'Remove custom alias from a ticket'

  static override args = {
    ticketId: Args.string({
      description: 'ID or alias of the ticket',
      required: true,
    }),
    alias: Args.string({
      description: 'Custom alias to remove',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.flags,
  }

  static override examples = [
    'pm alias remove 01K12Q9KTAKWKBEV84ZCP4R0EX auth-bug',
    'pm alias remove ticket-456 login-fix',
  ]

  async execute(args: ExecuteArgs, flags: ExecuteFlags): Promise<any> {
    if (!args.ticketId || !args.alias) {
      this.error('Both ticket ID and alias are required')
    }

    try {
      await this.sdk.aliases.remove({ ticketId: args.ticketId, alias: args.alias })

      if (flags.json) {
        return {
          ticketId: args.ticketId,
          alias: args.alias,
          status: 'removed',
        }
      }

      this.log(`Removed custom alias "${args.alias}" from ticket ${args.ticketId}`)
      return undefined
    } catch (error: any) {
      this.error(`Failed to remove alias: ${error.message}`)
    }
  }
}
