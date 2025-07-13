#!/usr/bin/env node

/**
 * oclif-based CLI runner for project-manager.
 * This replaces the old Commander.js-based implementation.
 */

import { execute } from '@oclif/core'

// Execute the CLI with oclif
await execute({
  dir: import.meta.url,
})
