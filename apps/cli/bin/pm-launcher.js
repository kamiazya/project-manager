#!/usr/bin/env node

/**
 * Launcher script for the PM CLI.
 * This script determines whether to run in development or production mode.
 */

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Check if we're in development by looking for source files
const srcPath = join(__dirname, '../src/bin/run-dev.ts')
const isDevelopment = existsSync(srcPath)

if (isDevelopment) {
  // Development mode: use tsx to run TypeScript directly
  process.env.NODE_ENV = process.env.NODE_ENV || 'development'

  // Pass all arguments to tsx
  const args = process.argv.slice(2)
  const tsxCommand = `tsx "${srcPath}" ${args.map(arg => `"${arg}"`).join(' ')}`

  try {
    execSync(tsxCommand, { stdio: 'inherit' })
  } catch (error) {
    // execSync throws on non-zero exit codes
    process.exit(error.status || 1)
  }
} else {
  // Production mode: run compiled JavaScript
  await import('../dist/bin/run.js')
}
