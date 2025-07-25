#!/usr/bin/env node

/**
 * Launcher script for the PM CLI.
 * This script determines whether to run in development or production mode.
 */

import { spawn } from 'node:child_process'
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

  // Pass all arguments to tsx securely using spawn
  const args = process.argv.slice(2)

  try {
    const child = spawn('tsx', [srcPath, ...args], {
      stdio: 'inherit',
      shell: false, // Disable shell interpretation for security
    })

    child.on('close', code => {
      process.exit(code || 0)
    })

    child.on('error', error => {
      console.error('Failed to start tsx:', error)
      process.exit(1)
    })
  } catch (error) {
    console.error('Failed to spawn tsx process:', error)
    process.exit(1)
  }
} else {
  // Production mode: run compiled JavaScript
  await import('../dist/bin/run.js')
}
