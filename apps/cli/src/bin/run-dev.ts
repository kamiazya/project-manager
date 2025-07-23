#!/usr/bin/env tsx

/**
 * Development wrapper for oclif CLI runner.
 * This script automatically sets NODE_ENV=development before executing the main CLI.
 *
 * In production, this file is not included (see package.json publishConfig).
 * The production binary uses run.ts directly.
 */

// Set development environment as default if not specified
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development'
}

// Import and execute the main runner
import './run.ts'
