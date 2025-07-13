import { spawn } from 'node:child_process'
import { createCLI } from '../cli.js'

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
      if (mcpArg.includes('=')) {
        mcpMode = mcpArg.split('=')[1]
      } else if (mcpIndex + 1 < args.length && !args[mcpIndex + 1].startsWith('-')) {
        mcpMode = args[mcpIndex + 1]
      }

      const isDev = process.env.NODE_ENV === 'development'
      const envMode = isDev ? 'development' : 'production'

      // Parse MCP mode configuration
      const modeParts = mcpMode.split(':')
      const transportMode = modeParts[0] // 'stdio' or 'http'
      const httpPort = transportMode === 'http' && modeParts[1] ? modeParts[1] : '3000'
      const isStateless = transportMode === 'http' && modeParts[2] === 'stateless'

      console.log(
        `Starting MCP server in ${envMode} mode (${transportMode}${transportMode === 'http' ? `:${httpPort}${isStateless ? ':stateless' : ''}` : ''})...`
      )

      let mcpProcess: any
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
        }, 3000)
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
