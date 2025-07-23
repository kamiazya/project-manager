/**
 * oclif-based CLI runner for project-manager.
 */

import { execute } from '@oclif/core'

// Execute the CLI with oclif
await execute({
  dir: import.meta.url,
})
