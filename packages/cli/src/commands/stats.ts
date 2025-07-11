import { Command } from 'commander'
import { showStatsAction } from '../utils/cli-helpers.js'

export function statsCommand(): Command {
  const command = new Command('stats')
    .description('Show ticket statistics')
    .option('--json', 'Output in JSON format')
    .action(async options => {
      await showStatsAction({ json: options.json })
    })

  return command
}
