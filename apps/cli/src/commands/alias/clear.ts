import { Args, Flags } from '@oclif/core'
import type { ClearCustomAliasesResponse } from '@project-manager/application'
import { BaseCommand } from '../../lib/base-command.ts'

interface ExecuteArgs extends Record<string, unknown> {
  ticketId: string
}

interface ExecuteFlags extends Record<string, unknown> {
  json?: boolean // Inherited from BaseCommand
  confirm?: boolean
}

/**
 * Clear all custom aliases from a ticket
 */
export class AliasClearCommand extends BaseCommand<
  ExecuteArgs,
  ExecuteFlags,
  ClearCustomAliasesResponse | undefined
> {
  static override description = 'Clear all custom aliases from a ticket'

  static override args = {
    ticketId: Args.string({
      description: 'ID or alias of the ticket',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.flags,
    confirm: Flags.boolean({
      char: 'y',
      description: 'Confirm the operation without prompting',
      default: false,
    }),
  }

  static override examples = [
    'pm alias clear 01K12Q9KTAKWKBEV84ZCP4R0EX --confirm',
    'pm alias clear ticket-456 -y',
  ]

  async execute(
    args: ExecuteArgs,
    flags: ExecuteFlags
  ): Promise<ClearCustomAliasesResponse | undefined> {
    // Safety check - require confirmation
    if (!flags.confirm) {
      this.error(
        'This operation will remove ALL custom aliases from the ticket. Use --confirm (-y) to proceed.'
      )
    }

    try {
      const result = await this.sdk.aliases.clear({
        ticketId: args.ticketId,
        confirm: flags.confirm,
      })

      if (flags.json) {
        return result
      }

      if (result.clearedCount === 0) {
        this.log(`No custom aliases found on ticket ${args.ticketId}`)
      } else {
        let message = `Cleared ${result.clearedCount} custom alias(es) from ticket ${args.ticketId}`

        if (result.clearedAliases.length > 0) {
          message += `\nRemoved aliases: ${result.clearedAliases.join(', ')}`
        }

        if (result.remainingCanonicalAlias) {
          message += `\nCanonical alias "${result.remainingCanonicalAlias}" was preserved`
        }

        this.log(message)
      }

      return undefined
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred'
      this.error(`Failed to clear custom aliases: ${message}`)
    }
  }
}
