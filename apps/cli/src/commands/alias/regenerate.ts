import { Args, Flags } from '@oclif/core'
import type { RegenerateCanonicalAliasResponse } from '@project-manager/application'
import { BaseCommand } from '../../lib/base-command.ts'

interface ExecuteArgs extends Record<string, unknown> {
  ticketId: string
}

interface ExecuteFlags extends Record<string, unknown> {
  json?: boolean // Inherited from BaseCommand
  force?: boolean
}

/**
 * Regenerate canonical alias for a ticket
 */
export class AliasRegenerateCommand extends BaseCommand<
  ExecuteArgs,
  ExecuteFlags,
  RegenerateCanonicalAliasResponse | undefined
> {
  static override description = 'Regenerate the canonical alias for a ticket'

  static override args = {
    ticketId: Args.string({
      description: 'ID or alias of the ticket',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.flags,
    force: Flags.boolean({
      char: 'f',
      description: 'Force regeneration even if canonical alias already exists',
      default: false,
    }),
  }

  static override examples = [
    'pm alias regenerate 01K12Q9KTAKWKBEV84ZCP4R0EX',
    'pm alias regenerate ticket-456 --force',
  ]

  async execute(
    args: ExecuteArgs,
    flags: ExecuteFlags
  ): Promise<RegenerateCanonicalAliasResponse | undefined> {
    try {
      const result = await this.sdk.aliases.regenerateCanonical({
        ticketId: args.ticketId,
        force: flags.force,
      })

      if (flags.json) {
        return result
      }

      let message = `Generated new canonical alias "${result.newCanonicalAlias}" for ticket ${args.ticketId}`

      if (result.previousCanonicalAlias) {
        message += `\nPrevious canonical alias "${result.previousCanonicalAlias}" was replaced`
      } else {
        message += '\nThis ticket now has its first canonical alias'
      }

      if (result.wasForced) {
        message += '\n(Forced regeneration)'
      }

      this.log(message)
      return undefined
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred'
      this.error(`Failed to regenerate canonical alias: ${message}`)
    }
  }
}
