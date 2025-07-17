import { Args } from '@oclif/core'
import { type Config, getConfig } from '@project-manager/shared'
import { BaseCommand } from '../../lib/base-command.ts'

/**
 * Get a configuration value
 */
export class ConfigGetCommand extends BaseCommand {
  static override description = 'Get a configuration value'

  static override examples = [
    '<%= config.bin %> <%= command.id %> defaultPriority',
    '<%= config.bin %> <%= command.id %> storagePath',
  ]

  static override args = {
    key: Args.string({
      description: 'Configuration key to get',
      required: true,
    }),
  }

  async execute(args: { key: string }): Promise<string | number | boolean | undefined> {
    const config = getConfig()

    // Type-safe key validation
    if (!this.isValidConfigKey(args.key, config)) {
      // Return undefined for non-existent keys (as expected by tests)
      return undefined
    }

    const value = config[args.key as keyof Config]

    // Return the value for proper JSON output handling
    return value
  }

  private isValidConfigKey(key: string, config: Config): key is keyof Config {
    return key in config
  }
}
