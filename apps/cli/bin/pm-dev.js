#!/usr/bin/env node

/**
 * Development launcher using tsx ESM API
 * This runs TypeScript directly without subprocess using tsx's register() API
 */

// Set development environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development'

// Use tsx ESM API to register TypeScript support
import { register } from 'tsx/esm/api'

// Register TypeScript support
register()

// Import and run the TypeScript file directly
import('../src/bin/run-dev.ts')
  .catch(error => {
    console.error('Failed to start CLI:', error)
    process.exit(1)
  })
  .finally(() => {
    // Cleanup is handled automatically on process exit
    // unregister() could be called here if needed
  })
