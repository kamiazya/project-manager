import { Args, Flags } from '@oclif/core'
import type { ValidateAliasResponse } from '@project-manager/application'
import { BaseCommand } from '../../lib/base-command.ts'

interface ExecuteArgs extends Record<string, unknown> {
  alias: string
}

interface ExecuteFlags extends Record<string, unknown> {
  type?: 'canonical' | 'custom'
  'check-uniqueness'?: boolean
  'exclude-ticket'?: string
  json?: boolean // Inherited from BaseCommand
}

/**
 * Validate an alias for format, uniqueness, and rules
 */
export class AliasValidateCommand extends BaseCommand<
  ExecuteArgs,
  ExecuteFlags,
  ValidateAliasResponse | undefined
> {
  static override description = 'Validate an alias for format, uniqueness, and type-specific rules'

  static override args = {
    alias: Args.string({
      description: 'The alias to validate',
      required: true,
    }),
  }

  static override flags = {
    ...BaseCommand.flags,
    type: Flags.string({
      description: 'Type of alias to validate against',
      options: ['canonical', 'custom'],
    }),
    'check-uniqueness': Flags.boolean({
      description: 'Check if alias is unique across all tickets',
      default: false,
    }),
    'exclude-ticket': Flags.string({
      description: 'Ticket ID to exclude from uniqueness check (for updates)',
    }),
  }

  static override examples = [
    'pm alias validate "my-alias"',
    'pm alias validate "bug-fix" --type custom',
    'pm alias validate "TASK-123" --type canonical --check-uniqueness',
    'pm alias validate "updated-alias" --check-uniqueness --exclude-ticket 1234567890',
  ]

  async execute(
    args: ExecuteArgs,
    flags: ExecuteFlags
  ): Promise<ValidateAliasResponse | undefined> {
    try {
      const result = await this.sdk.aliases.validate({
        alias: args.alias,
        aliasType: flags.type,
        checkUniqueness: flags['check-uniqueness'],
        excludeTicketId: flags['exclude-ticket'],
      })

      if (flags.json) {
        return result
      }

      // Display validation results
      this.log(`Validation results for alias "${result.alias}":`)
      this.log('')

      // Overall status
      if (result.isValid) {
        this.log('✅ Alias is valid')
      } else {
        this.log('❌ Alias is invalid')
      }
      this.log('')

      // Format validation
      this.log('📋 Format validation:')
      if (result.validation.format.isValid) {
        this.log('   ✅ Format is valid')
      } else {
        this.log('   ❌ Format validation failed:')
        result.validation.format.errors.forEach(error => {
          this.log(`      • ${error}`)
        })
      }
      this.log('')

      // Uniqueness validation (if requested)
      if (result.validation.uniqueness) {
        this.log('🔍 Uniqueness validation:')
        if (result.validation.uniqueness.isUnique) {
          this.log('   ✅ Alias is unique')
        } else {
          this.log('   ❌ Alias is not unique:')
          this.log(
            `      • Conflicts with ${result.validation.uniqueness.conflictingAliasType} alias`
          )
          this.log(`      • On ticket: ${result.validation.uniqueness.conflictingTicketId}`)
        }
        this.log('')
      }

      // Type-specific validation
      if (result.validation.typeSpecific) {
        this.log(`📝 Type-specific validation (${flags.type || 'custom'}):`)
        if (result.validation.typeSpecific.isValid) {
          this.log('   ✅ Type-specific rules passed')
        } else {
          this.log('   ❌ Type-specific validation failed:')
          result.validation.typeSpecific.errors.forEach(error => {
            this.log(`      • ${error}`)
          })
        }
        this.log('')
      }

      // Overall errors
      if (result.errors.length > 0) {
        this.log('🚫 Validation errors:')
        result.errors.forEach(error => {
          this.log(`   • ${error}`)
        })
        this.log('')
      }

      // Suggestions
      if (result.suggestions.length > 0) {
        this.log('💡 Suggestions:')
        result.suggestions.forEach(suggestion => {
          this.log(`   • ${suggestion}`)
        })
      }

      return undefined
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred'
      this.error(`Failed to validate alias: ${message}`)
    }
  }
}
