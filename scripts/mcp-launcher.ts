#!/usr/bin/env tsx

/**
 * MCP Server Development Launcher for project-manager
 *
 * This launcher provides a development-focused entry point for the MCP server that:
 * - Enables hot reload using tsx for development productivity
 * - Transparently forwards all command line arguments
 * - Watches for file changes and automatically restarts the server
 *
 * This approach separates development concerns from the core MCP server,
 * maintaining clean architecture and single responsibility principle.
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
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const monorepoRoot = path.resolve(__dirname, '..')
const mcpServerEntry = path.join(__dirname, 'mcp-server.ts')
const scriptsConfigPath = path.join(__dirname, 'tsconfig.json')

// Watch directories for file changes (packages and mcp-server source)
const watchDirectories = [
  path.join(monorepoRoot, 'packages'),
  path.join(monorepoRoot, 'apps/mcp-server/src'),
]

// Set development environment
process.env.NODE_ENV = 'development'

// Generate session ID for this MCP server instance (supports multiple concurrent servers)
const sessionId = Math.random().toString(36).substring(2, 8)
process.env.PM_SESSION_ID = sessionId

// Forward all command line arguments to the MCP server
const forwardedArgs = process.argv.slice(2)

// --- Main Logic ---
runWithHotReload().catch(error => {
  console.error(
    `${HOT_RELOAD_PREFIX} ${colors.red}Failed to start hot reload:${colors.reset}`,
    error
  )
  process.exit(1)
})

// --- Hot Reload Implementation ---
async function runWithHotReload() {
  let child: ChildProcess | null = null
  let isRestarting = false
  let restartTimeout: NodeJS.Timeout | null = null
  let watchController: AbortController | null = null

  // Track known files for change detection across all watch directories
  const knownFiles = new Map<string, Set<string>>()

  const log = (message: string) => console.error(`${HOT_RELOAD_PREFIX} ${message}`)

  // Check if file should be ignored (test files)
  function shouldIgnoreFile(filePath: string): boolean {
    return filePath.includes('.test.') || filePath.includes('.spec.')
  }

  // Initialize known files list for all watch directories
  async function initializeKnownFiles() {
    for (const watchDir of watchDirectories) {
      try {
        const files = await readdir(watchDir, { recursive: true })
        const fileSet = new Set<string>()
        for (const file of files) {
          if (typeof file === 'string' && !shouldIgnoreFile(file)) {
            fileSet.add(file)
          }
        }
        knownFiles.set(watchDir, fileSet)
      } catch (error) {
        log(
          `${colors.yellow}Warning: Could not read initial file list for ${watchDir}:${colors.reset} ${error}`
        )
      }
    }
  }

  function startServer() {
    log(
      `${colors.green}Starting MCP server with hot reload (session: ${sessionId})...${colors.reset}`
    )
    try {
      child = spawn('tsx', ['--tsconfig', scriptsConfigPath, mcpServerEntry, ...forwardedArgs], {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'development', PM_SESSION_ID: sessionId },
      })

      child.on('close', (code: number | null) => {
        const exitMessage =
          code !== null
            ? `Server process exited with code ${code}`
            : 'Server process was terminated by signal'
        log(exitMessage)

        child = null
        if (!isRestarting) {
          if (code === 0) {
            log('Server exited gracefully. Shutting down launcher.')
            process.exit(0)
          } else {
            const reason = code !== null ? `crashed (code ${code})` : 'was terminated by signal'
            log(`${colors.red}Server ${reason}. Restarting in 1 second...${colors.reset}`)
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

  async function handleFileEvent(watchDir: string, eventType: string, filename: string | null) {
    if (!filename) return

    // Ignore test files
    if (shouldIgnoreFile(filename)) return

    const fullPath = path.join(watchDir, filename)
    const relativePath = path.relative(monorepoRoot, fullPath)
    const fileSet = knownFiles.get(watchDir)

    if (!fileSet) return

    if (eventType === 'rename') {
      // Check if file exists to determine if it was added or removed
      try {
        await access(fullPath, constants.F_OK)
        // File exists - it was added
        if (!fileSet.has(filename)) {
          log(`File added: ${relativePath}`)
          fileSet.add(filename)
          debouncedRestart()
        }
      } catch {
        // File doesn't exist - it was removed
        if (fileSet.has(filename)) {
          log(`File removed: ${relativePath}`)
          fileSet.delete(filename)
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

      log(`Watching for changes in:`)
      for (const watchDir of watchDirectories) {
        log(`  ${colors.cyan}${watchDir}${colors.reset}`)
      }
      log(`Ignoring test files (*.test.ts, *.spec.ts)`)

      // Start watching all directories concurrently
      const watchers = watchDirectories.map(async watchDir => {
        try {
          const watcher = watch(watchDir, {
            recursive: true,
            signal: watchController!.signal,
          })

          for await (const event of watcher) {
            await handleFileEvent(watchDir, event.eventType, event.filename)
          }
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            log(`${colors.red}File watching error for ${watchDir}:${colors.reset} ${error}`)
          }
        }
      })

      await Promise.all(watchers)
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
