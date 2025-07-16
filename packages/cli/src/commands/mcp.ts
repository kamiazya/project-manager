import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { Flags } from '@oclif/core'
import { BaseCommand } from '../lib/base-command.ts'

interface ExecuteFlags {
  version?: boolean
  json?: boolean
}

/**
 * Start MCP server for AI integration
 */
export class McpCommand extends BaseCommand {
  static override description = 'Start MCP server for AI integration'

  static override examples = [
    '<%= config.bin %> <%= command.id %> # Start MCP server in stdio mode',
    '<%= config.bin %> <%= command.id %> --help # Show available options',
  ]

  static override flags = {
    version: Flags.boolean({
      char: 'v',
      description: 'Show MCP server version and exit',
    }),
  }

  async execute(flags: ExecuteFlags): Promise<void> {
    if (flags.version) {
      // Import package.json to get version
      const { version } = await import('@project-manager/mcp-server/package.json', {
        with: { type: 'json' },
      })
      this.log(version)
      return
    }

    try {
      // Dynamically import MCP server to avoid build dependencies
      const { createMcpServer } = await import('@project-manager/mcp-server')

      // Create MCP server using the existing function
      const server = await createMcpServer()

      // Use stdio transport for mcp.json compatibility
      const transport = new StdioServerTransport()
      await server.connect(transport)

      // Log to stderr so it doesn't interfere with MCP protocol on stdout
      const mode = process.env.NODE_ENV === 'development' ? 'development' : 'production'
      console.error(`MCP server started successfully in ${mode} mode (stdio)`)

      if (process.env.NODE_ENV === 'development') {
        console.error('[DEV] Server is ready to accept MCP connections')
        console.error('[DEV] Communication via stdin/stdout for mcp.json compatibility')
      }

      // Graceful shutdown function
      const gracefulShutdown = async (signal: string) => {
        console.error(`\nReceived ${signal}, shutting down MCP server gracefully...`)
        try {
          if (server && typeof server.close === 'function') {
            await server.close()
            console.error('MCP server closed successfully')
          }
        } catch (error) {
          console.error('Error during server shutdown:', error)
        } finally {
          process.exit(0)
        }
      }

      // Keep the process alive and handle signals
      process.on('SIGINT', () => gracefulShutdown('SIGINT'))
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    } catch (error) {
      this.error(`Failed to start MCP server: ${error}`, { exit: 1 })
    }
  }
}
