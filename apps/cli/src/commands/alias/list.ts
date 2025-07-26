import { Args } from '@oclif/core'
import type { ListAliasesResponse } from '@project-manager/application'
import { BaseCommand } from '../../lib/base-command.ts'

interface ExecuteArgs extends Record<string, unknown> {
  ticketId: string
}

interface ExecuteFlags extends Record<string, unknown> {
  json?: boolean // Inherited from BaseCommand
}

/**
 * List all aliases for a ticket
 */
export class AliasListCommand extends BaseCommand<
  ExecuteArgs,
  ExecuteFlags,
  ListAliasesResponse | undefined
> {
  static override description = 'List all aliases for a ticket'

  static override args = {
    ticketId: Args.string({
      description: 'ID or alias of the ticket',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.flags,
  }

  static override examples = [
    'pm alias list 01K12Q9KTAKWKBEV84ZCP4R0EX',
    'pm alias list ticket-456',
  ]

  async execute(args: ExecuteArgs, flags: ExecuteFlags): Promise<ListAliasesResponse | undefined> {
    try {
      const result = await this.sdk.aliases.list({ ticketId: args.ticketId })

      if (flags.json) {
        return result
      }

      this.log(`Aliases for ticket ${result.ticketId}:`)

      if (result.aliases.length === 0) {
        this.log('  No aliases found')
        return undefined
      }

      for (const aliasInfo of result.aliases) {
        const typeLabel = aliasInfo.type === 'canonical' ? '(canonical)' : '(custom)'
        this.log(`  ${aliasInfo.alias} ${typeLabel}`)
      }

      return undefined
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred'
      this.error(`Failed to list aliases: ${message}`)
    }
  }
}
