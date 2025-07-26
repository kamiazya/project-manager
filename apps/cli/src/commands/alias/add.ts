import { Args } from '@oclif/core'
import { BaseCommand } from '../../lib/base-command.ts'

interface ExecuteArgs extends Record<string, unknown> {
  ticketId: string
  alias: string
}

interface ExecuteFlags extends Record<string, unknown> {
  json?: boolean // Inherited from BaseCommand
}

interface AddAliasResult {
  ticketId: string
  alias: string
  type: 'custom'
  status: 'added'
}

/**
 * Add custom alias to ticket
 */
export class AliasAddCommand extends BaseCommand<
  ExecuteArgs,
  ExecuteFlags,
  AddAliasResult | undefined
> {
  static override description = 'Add custom alias to a ticket'

  static override args = {
    ticketId: Args.string({
      description: 'ID or alias of the ticket',
      required: true,
    }),
    alias: Args.string({
      description: 'Custom alias to add',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.flags,
  }

  static override examples = [
    'pm alias add 01K12Q9KTAKWKBEV84ZCP4R0EX auth-bug',
    'pm alias add ticket-456 login-fix',
  ]

  async execute(args: ExecuteArgs, flags: ExecuteFlags): Promise<AddAliasResult | undefined> {
    if (!args.ticketId || !args.alias) {
      this.error('Both ticket ID and alias are required')
    }

    try {
      await this.sdk.aliases.add(args.ticketId, args.alias)

      if (flags.json) {
        return {
          ticketId: args.ticketId,
          alias: args.alias,
          type: 'custom',
          status: 'added',
        }
      }

      this.log(`Added custom alias "${args.alias}" to ticket ${args.ticketId}`)
      return undefined
    } catch (error: any) {
      this.error(`Failed to add alias: ${error.message}`)
    }
  }
}
