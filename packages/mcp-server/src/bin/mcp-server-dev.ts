#!/usr/bin/env tsx

/**
 * Development wrapper for the MCP server with hot reload functionality.
 * This script automatically sets NODE_ENV=development and provides hot reload
 * when files in the src/ directory change.
 *
 * In production, this file is not included (see package.json publishConfig).
 * The production binary uses mcp-server.ts directly.
 */

import { type ChildProcess, spawn } from 'node:child_process'
import { constants } from 'node:fs'
import { access, readdir, watch } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// --- Constants ---
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
}
const HOT_RELOAD_PREFIX = `${colors.cyan}[Hot Reload]${colors.reset}`

// --- Environment Setup ---
// Set development environment as default if not specified
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development'
}

// Check if hot reload should be enabled
const enableHotReload = process.env.NODE_ENV === 'development'

// --- Main Logic ---
if (!enableHotReload) {
  // Production mode: Just run the server directly without hot reload
  import('./mcp-server.ts')
} else {
  // Development mode: Run with hot reload
  runWithHotReload().catch(error => {
    console.error(
      `${HOT_RELOAD_PREFIX} ${colors.red}Failed to start hot reload:${colors.reset}`,
      error
    )
    process.exit(1)
  })
}

// --- Hot Reload Implementation ---
async function runWithHotReload() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  const packageRoot = path.resolve(__dirname, '../..')
  const serverEntry = path.join(packageRoot, 'src/bin/mcp-server.ts')
  const tsconfigPath = path.join(packageRoot, 'tsconfig.json')
  const srcDir = path.join(packageRoot, 'src')

  let child: ChildProcess | null = null
  let isRestarting = false
  let restartTimeout: NodeJS.Timeout | null = null
  let watchController: AbortController | null = null

  // Track known files for change detection
  const knownFiles = new Set<string>()

  const log = (message: string) => console.error(`${HOT_RELOAD_PREFIX} ${message}`)

  // Initialize known files list
  async function initializeKnownFiles() {
    try {
      const files = await readdir(srcDir, { recursive: true })
      for (const file of files) {
        if (typeof file === 'string') {
          knownFiles.add(file)
        }
      }
    } catch (error) {
      log(`${colors.yellow}Warning: Could not read initial file list:${colors.reset} ${error}`)
    }
  }

  function startServer() {
    log(`${colors.green}Starting MCP server...${colors.reset}`)
    try {
      child = spawn('tsx', ['--tsconfig', tsconfigPath, serverEntry], {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'development' },
      })

      child.on('close', code => {
        log(`Server process exited with code ${code}`)
        child = null
        if (!isRestarting) {
          if (code === 0) {
            log('Server exited gracefully. Shutting down wrapper.')
            process.exit(0)
          } else {
            log(`${colors.red}Server crashed. Restarting in 1 second...${colors.reset}`)
            setTimeout(startServer, 1000)
          }
        }
      })

      child.on('error', err => {
        log(`${colors.red}Failed to start server:${colors.reset} ${err}`)
        if (!isRestarting) {
          log(`${colors.yellow}Retrying in 2 seconds...${colors.reset}`)
          setTimeout(startServer, 2000)
        }
      })
    } catch (error) {
      log(`${colors.red}Failed to spawn server process:${colors.reset} ${error}`)
      log(`${colors.yellow}Please ensure 'tsx' is installed and in your PATH.${colors.reset}`)
      process.exit(1)
    }
  }

  function restartServer() {
    if (isRestarting) return
    isRestarting = true

    log(`${colors.yellow}Restarting server...${colors.reset}`)

    if (child) {
      const killTimeout = setTimeout(() => {
        log(`${colors.red}Server did not terminate gracefully. Forcing kill.${colors.reset}`)
        child?.kill('SIGKILL')
      }, 2000) // 2-second timeout for graceful shutdown

      child.once('close', () => {
        clearTimeout(killTimeout)
        startServer()
        isRestarting = false
      })

      child.kill('SIGTERM')
    } else {
      // If the server isn't running (e.g., it crashed), just start it.
      startServer()
      isRestarting = false
    }
  }

  function debouncedRestart() {
    if (restartTimeout) clearTimeout(restartTimeout)
    restartTimeout = setTimeout(restartServer, 300) // 300ms debounce delay
  }

  async function handleFileEvent(eventType: string, filename: string | null) {
    if (!filename) return

    const fullPath = path.join(srcDir, filename)
    const relativePath = path.relative(packageRoot, fullPath)

    if (eventType === 'rename') {
      // Check if file exists to determine if it was added or removed
      try {
        await access(fullPath, constants.F_OK)
        // File exists - it was added
        if (!knownFiles.has(filename)) {
          log(`File added: ${relativePath}`)
          knownFiles.add(filename)
          debouncedRestart()
        }
      } catch {
        // File doesn't exist - it was removed
        if (knownFiles.has(filename)) {
          log(`File removed: ${relativePath}`)
          knownFiles.delete(filename)
          debouncedRestart()
        }
      }
    } else if (eventType === 'change') {
      log(`File changed: ${relativePath}`)
      debouncedRestart()
    }
  }

  async function startWatching() {
    try {
      watchController = new AbortController()
      const watcher = watch(srcDir, {
        recursive: true,
        signal: watchController.signal,
      })

      log(`Watching for changes in ${colors.cyan}${srcDir}${colors.reset}`)
      log(`To disable, set ${colors.yellow}NODE_ENV=production${colors.reset}`)

      for await (const event of watcher) {
        await handleFileEvent(event.eventType, event.filename)
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        log('File watching stopped.')
      } else {
        log(`${colors.red}File watching error:${colors.reset} ${error}`)
        // Restart watching after a delay
        setTimeout(() => startWatching(), 2000)
      }
    }
  }

  // --- Initial Setup ---
  await initializeKnownFiles()
  startServer()

  // Start file watching (non-blocking)
  startWatching().catch(error => {
    log(`${colors.red}Failed to start file watching:${colors.reset} ${error}`)
  })

  // --- Graceful Shutdown Handling ---
  const shutdown = (signal: NodeJS.Signals) => {
    log(`Received ${signal}. Shutting down...`)
    watchController?.abort()
    if (child) {
      child.kill(signal)
    }
    process.exit(0)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}
