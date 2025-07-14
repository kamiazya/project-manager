import { Args } from '@oclif/core'
import { getConfig } from '@project-manager/shared'
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

  async execute(args: { key: string }): Promise<any> {
    const config = getConfig()
    const value = (config as any)[args.key]

    if (value === undefined) {
      this.error(`Configuration key not found: ${args.key}`)
    }

    this.log(value)
  }
}
