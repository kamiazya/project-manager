/**
 * oclif-based CLI runner for project-manager.
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execute } from '@oclif/core'

// Get the CLI root directory (apps/cli) from the current file location
const currentFileDir = dirname(fileURLToPath(import.meta.url))
const cliRoot = join(currentFileDir, '..', '..')

// In development mode, set the working directory to CLI root to help oclif find TypeScript files
if (process.env.NODE_ENV === 'development') {
  process.chdir(cliRoot)
}

// Execute the CLI with oclif
await execute({
  dir: import.meta.url,
})
