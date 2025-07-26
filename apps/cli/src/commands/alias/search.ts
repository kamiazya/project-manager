import { Args, Flags } from '@oclif/core'
import type { FindTicketByAliasResponse } from '@project-manager/application'
import { BaseCommand } from '../../lib/base-command.ts'
import { TicketFormatter } from '../../utils/ticket-formatter.ts'

interface ExecuteArgs extends Record<string, unknown> {
  alias: string
}

interface ExecuteFlags extends Record<string, unknown> {
  'case-sensitive'?: boolean
  json?: boolean // Inherited from BaseCommand
}

/**
 * Search for tickets by alias
 */
export class AliasSearchCommand extends BaseCommand<
  ExecuteArgs,
  ExecuteFlags,
  FindTicketByAliasResponse | undefined
> {
  static override description = 'Search for a ticket by its alias'

  static override args = {
    alias: Args.string({
      description: 'The alias to search for',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.flags,
    'case-sensitive': Flags.boolean({
      description: 'Perform case-sensitive search',
      default: false,
    }),
  }

  static override examples = [
    'pm alias search "my-alias"',
    'pm alias search "bug-fix" --case-sensitive',
    'pm alias search "TASK-123" --case-sensitive',
  ]

  async execute(
    args: ExecuteArgs,
    flags: ExecuteFlags
  ): Promise<FindTicketByAliasResponse | undefined> {
    if (!args.alias) {
      this.error('Alias is required')
    }

    try {
      const result = await this.sdk.aliases.findTicket({
        alias: args.alias,
        caseSensitive: flags['case-sensitive'],
      })

      if (flags.json) {
        return result
      }

      if (result.ticket) {
        this.log(`✅ Found ticket by alias "${result.searchAlias}":`)
        this.log(`   Matched: ${result.matchedAliasType} alias`)
        this.log(`   Case-sensitive: ${result.caseSensitive}`)
        this.log('')

        // Format and display the ticket
        this.log(TicketFormatter.format(result.ticket))
        return undefined
      } else {
        this.log(`❌ No ticket found with alias "${result.searchAlias}"`)
        this.log(`   Case-sensitive: ${result.caseSensitive}`)

        // Suggest trying case-insensitive search if case-sensitive failed
        if (result.caseSensitive) {
          this.log(`   💡 Try without --case-sensitive flag for broader search`)
        }
        return undefined
      }
    } catch (error: any) {
      this.error(`Failed to search for ticket: ${error.message}`)
    }
  }
}
