#!/usr/bin/env tsx

/**
 * Development wrapper for the project manager CLI.
 * This script automatically sets NODE_ENV=development before executing the main CLI.
 *
 * In production, this file is not included (see package.json publishConfig).
 * The production binary uses pm.ts directly.
 */

// Force development environment
process.env.NODE_ENV = 'development'

// Import and execute the main CLI
import './pm.js'
