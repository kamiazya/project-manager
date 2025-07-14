import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { Flags } from '@oclif/core'
import { createMcpServer } from '@project-manager/mcp-server'
import { BaseCommand } from '../lib/base-command.ts'

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

  async execute(_args: any, flags: any): Promise<void> {
    if (flags.version) {
      // Import package.json to get version
      const { version } = await import('@project-manager/mcp-server/package.json', {
        with: { type: 'json' },
      })
      this.log(version)
      return
    }

    try {
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

      // Keep the process alive
      process.on('SIGINT', () => {
        console.error('\nShutting down MCP server...')
        process.exit(0)
      })

      process.on('SIGTERM', () => {
        console.error('\nShutting down MCP server...')
        process.exit(0)
      })
    } catch (error) {
      this.error(`Failed to start MCP server: ${error}`, { exit: 1 })
    }
  }
}
