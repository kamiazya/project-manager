import { BaseCommand } from '../../lib/base-command.ts'

/**
 * Show environment variables that affect configuration
 */
export class ConfigEnvCommand extends BaseCommand {
  static override description = 'Show environment variables that affect configuration'

  static override examples = [
    '<%= config.bin %> <%= command.id %> # Show available environment variables',
  ]

  async execute(): Promise<any> {
    this.log('Environment Variables:')
    this.log('=====================')
    this.log('PM_STORAGE_PATH - Custom storage path')
    this.log('PM_DEFAULT_PRIORITY - Default priority (high, medium, low)')
    this.log('PM_DEFAULT_TYPE - Default type (feature, bug, task)')
    this.log('PM_DEFAULT_PRIVACY - Default privacy (local-only, shareable, public)')
    this.log('PM_DEFAULT_STATUS - Default status (pending, in_progress)')
    this.log('PM_DEFAULT_OUTPUT_FORMAT - Default output format (table, json, compact)')
    this.log('PM_CONFIRM_DELETION - Confirm deletion (true, false)')
    this.log('PM_SHOW_HELP_ON_ERROR - Show help on error (true, false)')
    this.log('PM_MAX_TITLE_LENGTH - Maximum title length (number)')
    this.log('PM_DATE_FORMAT - Date format (iso, short, relative)')
    this.log('PM_ENABLE_INTERACTIVE_MODE - Enable interactive mode (true, false)')
    this.log('PM_ENABLE_COLOR_OUTPUT - Enable color output (true, false)')
    this.log('XDG_CONFIG_HOME - XDG config directory')
    this.log()
    this.log('Currently set:')

    const envVars = [
      'PM_STORAGE_PATH',
      'PM_DEFAULT_PRIORITY',
      'PM_DEFAULT_TYPE',
      'PM_DEFAULT_PRIVACY',
      'PM_DEFAULT_STATUS',
      'PM_DEFAULT_OUTPUT_FORMAT',
      'PM_CONFIRM_DELETION',
      'PM_SHOW_HELP_ON_ERROR',
      'PM_MAX_TITLE_LENGTH',
      'PM_DATE_FORMAT',
      'PM_ENABLE_INTERACTIVE_MODE',
      'PM_ENABLE_COLOR_OUTPUT',
      'XDG_CONFIG_HOME',
    ]

    envVars.forEach(envVar => {
      const value = process.env[envVar]
      if (value !== undefined) {
        this.log(`  ${envVar}=${value}`)
      }
    })
  }
}
