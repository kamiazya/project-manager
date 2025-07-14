import { Flags } from '@oclif/core'
import { getConfig } from '@project-manager/shared'
import { BaseCommand } from '../../lib/base-command.ts'

/**
 * Show current configuration
 */
export class ConfigShowCommand extends BaseCommand {
  static override description = 'Show current configuration'

  static override examples = [
    '<%= config.bin %> <%= command.id %> # Show current configuration',
    '<%= config.bin %> <%= command.id %> --json # Show configuration in JSON format',
  ]

  static override flags = {
    json: Flags.boolean({
      description: 'Output in JSON format',
    }),
  }

  async execute(_args: any, flags: any): Promise<any> {
    const config = getConfig()

    if (flags.json) {
      return config
    }

    this.log('Current Configuration:')
    this.log('=====================')
    this.log(`Default Priority: ${config.defaultPriority}`)
    this.log(`Default Type: ${config.defaultType}`)
    this.log(`Default Privacy: ${config.defaultPrivacy}`)
    this.log(`Default Status: ${config.defaultStatus}`)
    this.log(`Default Output Format: ${config.defaultOutputFormat}`)
    this.log(`Confirm Deletion: ${config.confirmDeletion}`)
    this.log(`Show Help on Error: ${config.showHelpOnError}`)
    this.log(`Max Title Length: ${config.maxTitleLength}`)
    this.log(`Date Format: ${config.dateFormat}`)
    this.log(`Enable Interactive Mode: ${config.enableInteractiveMode}`)
    this.log(`Enable Color Output: ${config.enableColorOutput}`)

    if (config.storagePath) {
      this.log(`Storage Path: ${config.storagePath}`)
    }
  }
}
