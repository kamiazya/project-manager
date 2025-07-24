import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createMcpServer } from '@project-manager/mcp-server'
import { BaseCommand } from '../lib/base-command.ts'

/**
 * Start MCP server for AI integration
 */
export class McpCommand extends BaseCommand {
  static description = 'Start MCP server for AI integration'

  static examples = [
    '<%= config.bin %> <%= command.id %> # Start MCP server in stdio mode',
    '<%= config.bin %> <%= command.id %> --help # Show available options',
  ]

  protected async execute(
    _args: Record<string, unknown>,
    _flags: Record<string, unknown>
  ): Promise<void> {
    try {
      // Create MCP server using the SDK from CLI for process consistency
      const server = await createMcpServer(this.sdk)

      // Use stdio transport for mcp.json compatibility
      const transport = new StdioServerTransport()
      await server.connect(transport)

      // Log to stderr so it doesn't interfere with MCP protocol on stdout
      const environment = this.sdk.environment.getEnvironment()
      console.error(`MCP server started successfully in ${environment} environment (stdio)`)

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
