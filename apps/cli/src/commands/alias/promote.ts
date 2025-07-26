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
 * Promote custom alias to canonical status
 */
export class AliasPromoteCommand extends BaseCommand<ExecuteArgs, ExecuteFlags, any> {
  static override description = 'Promote a custom alias to canonical status'

  static override args = {
    ticketId: Args.string({
      description: 'ID or alias of the ticket',
      required: true,
    }),
    alias: Args.string({
      description: 'Custom alias to promote to canonical',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.flags,
  }

  static override examples = [
    'pm alias promote 01K12Q9KTAKWKBEV84ZCP4R0EX my-custom-alias',
    'pm alias promote ticket-456 better-name',
  ]

  async execute(args: ExecuteArgs, flags: ExecuteFlags): Promise<any> {
    if (!args.ticketId || !args.alias) {
      this.error('Both ticket ID and alias are required')
    }

    try {
      const result = await this.sdk.aliases.promote({
        ticketId: args.ticketId,
        alias: args.alias,
      })

      if (flags.json) {
        return result
      }

      let message = `Promoted custom alias "${result.alias}" to canonical for ticket ${args.ticketId}`

      if (result.previousCanonicalAlias) {
        message += `\nPrevious canonical alias "${result.previousCanonicalAlias}" was replaced`
      }

      if (result.totalCustomAliases === 0) {
        message += '\nThis ticket now has no custom aliases'
      } else {
        message += `\nThis ticket now has ${result.totalCustomAliases} custom alias(es)`
      }

      this.log(message)
      return undefined
    } catch (error: any) {
      this.error(`Failed to promote alias: ${error.message}`)
    }
  }
}
