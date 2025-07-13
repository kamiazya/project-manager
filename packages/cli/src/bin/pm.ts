import { type ChildProcess, spawn } from 'node:child_process'
import { createCLI } from '../cli.js'

export interface McpConfig {
  transportMode: 'stdio' | 'http'
  httpPort: string
  isStateless: boolean
}

export function validateMcpMode(mcpMode: string): McpConfig {
  // Parse MCP mode configuration
  const modeParts = mcpMode.split(':')
  const transportMode = modeParts[0] || '' // 'stdio' or 'http'

  // Validate transport mode
  if (!transportMode || !['stdio', 'http'].includes(transportMode)) {
    console.error(
      `Error: Invalid MCP transport mode '${transportMode}'. Allowed values: stdio, http`
    )
    console.error('Usage: --mcp stdio | --mcp http:port[:stateless]')
    process.exit(1)
  }

  // Parse and validate HTTP-specific options
  let httpPort = '3000'
  let isStateless = false

  if (transportMode === 'http') {
    // Validate port if provided
    if (modeParts[1] !== undefined) {
      httpPort = modeParts[1]

      // Check for empty port
      if (httpPort === '') {
        console.error(
          `Error: Invalid port '${httpPort}'. Port must be a number between 1 and 65535`
        )
        process.exit(1)
      }

      const portNum = parseInt(httpPort, 10)
      // Check if the original string equals the parsed number's string representation
      // This catches cases like '3000.5', '3000abc', whitespace, etc.
      if (isNaN(portNum) || portNum < 1 || portNum > 65535 || httpPort !== portNum.toString()) {
        console.error(
          `Error: Invalid port '${httpPort}'. Port must be a number between 1 and 65535`
        )
        process.exit(1)
      }
    }

    // Validate stateless flag if provided
    if (modeParts[2]) {
      if (modeParts[2] !== 'stateless') {
        console.error(`Error: Invalid flag '${modeParts[2]}'. Only 'stateless' flag is supported`)
        console.error('Usage: --mcp http:port:stateless')
        process.exit(1)
      }
      isStateless = true
    }

    // Validate no extra parts
    if (modeParts.length > 3) {
      console.error(`Error: Too many parameters in MCP mode '${mcpMode}'`)
      console.error('Usage: --mcp http:port[:stateless]')
      process.exit(1)
    }
  } else {
    // stdio mode should not have additional parameters
    if (modeParts.length > 1) {
      console.error(`Error: stdio mode does not accept additional parameters: '${mcpMode}'`)
      console.error('Usage: --mcp stdio')
      process.exit(1)
    }
  }

  return {
    transportMode: transportMode as 'stdio' | 'http',
    httpPort,
    isStateless,
  }
}

async function main() {
  try {
    const cli = createCLI()

    // Check for MCP server option before parsing
    const args = process.argv.slice(2)
    const mcpIndex = args.findIndex(arg => arg.startsWith('--mcp'))

    if (mcpIndex !== -1) {
      const mcpArg = args[mcpIndex]
      let mcpMode = 'stdio'

      // Parse MCP mode if provided
      if (mcpArg && mcpArg.includes('=')) {
        mcpMode = mcpArg.split('=')[1] || 'stdio'
      } else if (mcpIndex + 1 < args.length) {
        const nextArg = args[mcpIndex + 1]
        if (nextArg && !nextArg.startsWith('-')) {
          mcpMode = nextArg
        }
      }

      const isDev = process.env.NODE_ENV === 'development'
      const envMode = isDev ? 'development' : 'production'

      // Validate MCP mode configuration
      const config = validateMcpMode(mcpMode)
      const { transportMode, httpPort, isStateless } = config

      console.log(
        `Starting MCP server in ${envMode} mode (${transportMode}${transportMode === 'http' ? `:${httpPort}${isStateless ? ':stateless' : ''}` : ''})...`
      )

      let mcpProcess: ChildProcess
      let mcpArgs: string[] = []

      if (transportMode === 'http') {
        mcpArgs = ['--http', '--port', httpPort]
        if (isStateless) {
          mcpArgs.push('--stateless')
        }
      }

      if (isDev) {
        // Development mode with hot reload using tsx
        const mcpServerPath = new URL('../../../mcp-server/src/bin/mcp-server.ts', import.meta.url)
          .pathname
        mcpProcess = spawn('pnpm', ['exec', 'tsx', mcpServerPath, ...mcpArgs], {
          stdio: 'inherit',
          env: { ...process.env, NODE_ENV: 'development' },
          cwd: new URL('../../../mcp-server/', import.meta.url).pathname,
        })
      } else {
        // Production mode using built files
        mcpProcess = spawn(
          'node',
          [
            new URL('../../../mcp-server/dist/bin/mcp-server.js', import.meta.url).pathname,
            ...mcpArgs,
          ],
          {
            stdio: 'inherit',
            env: process.env,
          }
        )
      }

      mcpProcess.on('error', (err: Error) => {
        console.error(`Failed to start MCP server in ${envMode} mode:`, err)
        process.exit(1)
      })

      mcpProcess.on('exit', (code: number | null) => {
        console.log(`MCP server exited with code ${code}`)
        process.exit(code || 0)
      })

      // Handle graceful shutdown
      const cleanup = () => {
        console.log(`\nShutting down MCP server...`)
        mcpProcess.kill('SIGTERM')
        // Give it a moment to cleanup, then force kill
        setTimeout(() => {
          mcpProcess.kill('SIGKILL')
        }, 10000) // 10 seconds for graceful shutdown
      }

      process.on('SIGINT', cleanup)
      process.on('SIGTERM', cleanup)
    } else {
      // Normal CLI operation
      await cli.parseAsync(process.argv)
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
