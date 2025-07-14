import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { Hook } from '@oclif/core'
import { getStoragePath } from '../../utils/config.ts'

/**
 * Configuration validation hook that runs before command execution
 * Ensures that the storage directory and configuration are properly set up
 */
const configValidationHook: Hook<'init'> = async function (opts) {
  try {
    // Get storage path and ensure directory structure exists
    const storagePath = getStoragePath()
    const storageDir = dirname(storagePath)

    // Validate storage directory is accessible
    if (!existsSync(storageDir)) {
      this.warn(`Storage directory does not exist: ${storageDir}`)
      return
    }

    // Check if storage file exists and is readable
    if (existsSync(storagePath)) {
      try {
        // Attempt to read and parse the storage file to validate JSON format
        const content = readFileSync(storagePath, 'utf-8')
        if (content.trim()) {
          JSON.parse(content)
        }
      } catch (error) {
        this.warn(`Storage file is corrupted or invalid JSON: ${storagePath}`)
        this.warn('Creating backup and initializing fresh storage...')

        // Create backup of corrupted file
        const backupPath = `${storagePath}.backup.${Date.now()}`
        try {
          const corrupted = readFileSync(storagePath, 'utf-8')
          writeFileSync(backupPath, corrupted)
          this.warn(`Backup created at: ${backupPath}`)
        } catch (backupError) {
          this.warn('Failed to create backup of corrupted file')
        }

        // Initialize with empty storage structure
        writeFileSync(storagePath, JSON.stringify({ tickets: [], epics: [] }, null, 2))
        this.warn('Storage file has been reset to default structure')
      }
    }

    // Validate configuration environment
    const nodeEnv = process.env.NODE_ENV
    if (nodeEnv && !['development', 'production', 'test'].includes(nodeEnv)) {
      this.warn(`Unknown NODE_ENV value: ${nodeEnv}. Expected: development, production, or test`)
    }

    // Validate that required dependencies are available
    if (opts.id === 'mcp' && !process.env.CI) {
      // For MCP command, ensure tsx is available in development
      if (nodeEnv === 'development') {
        try {
          const { spawn } = await import('node:child_process')
          const child = spawn('tsx', ['--version'], { stdio: 'ignore' })
          child.on('error', () => {
            this.warn('tsx is not available. MCP hot reload may not work properly.')
            this.warn('Install tsx globally: npm install -g tsx')
          })
        } catch {
          // Ignore errors in environments where tsx check is not needed
        }
      }
    }
  } catch (error) {
    // Don't fail the command execution for validation errors
    // Just log warnings and continue
    this.warn(
      `Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export default configValidationHook
