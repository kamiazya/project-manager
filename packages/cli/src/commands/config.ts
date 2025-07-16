import { BaseCommand } from '../lib/base-command.ts'

/**
 * Manage configuration settings
 */
export class ConfigCommand extends BaseCommand {
  static description = 'Manage configuration settings'

  static examples = [
    '<%= config.bin %> <%= command.id %> # Show current configuration',
    '<%= config.bin %> <%= command.id %>:show # Show current configuration',
    '<%= config.bin %> <%= command.id %>:get <key> # Get a configuration value',
    '<%= config.bin %> <%= command.id %>:set <key> <value> # Set a configuration value',
    '<%= config.bin %> <%= command.id %>:env # Show environment variables',
  ]

  async execute(_args: Record<string, never>, _flags: Record<string, never>): Promise<void> {
    // Default action - show help for config commands
    await this.config.runCommand('help', ['config'])
  }
}
