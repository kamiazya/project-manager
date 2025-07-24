#!/usr/bin/env node
import { exec } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'

import pkg from '../package.json' with { type: 'json' }

const execAsync = promisify(exec)

async function generateManifest() {
  try {
    // Read current package.json

    // Save original commands path
    const originalCommands = pkg.oclif.commands

    // Update to compiled commands path
    pkg.oclif.commands = './dist/commands'

    // Write temporary package.json
    await writeFile('package.json', JSON.stringify(pkg, null, 2))

    try {
      // Generate manifest
      console.log('Generating oclif manifest...')
      await execAsync('npx oclif manifest')
      console.log('Manifest generated successfully')
    } finally {
      // Restore original package.json
      pkg.oclif.commands = originalCommands
      await writeFile('package.json', `${JSON.stringify(pkg, null, 2)}\n`)
    }
  } catch (error) {
    console.error('Error generating manifest:', error)
    process.exit(1)
  }
}

generateManifest()
