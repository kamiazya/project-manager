import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { Flags } from '@oclif/core'
import { getEnvironmentDisplayName, isDevelopmentLike } from '@project-manager/base'
import { NodeEnvironmentDetectionService } from '@project-manager/infrastructure'
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

  async execute(): Promise<void> {
    try {
      // Create MCP server using the SDK from CLI for process consistency
      const server = await createMcpServer(this.sdk)

      // Use stdio transport for mcp.json compatibility
      const transport = new StdioServerTransport()
      await server.connect(transport)

      // Log to stderr so it doesn't interfere with MCP protocol on stdout
      const environmentService = new NodeEnvironmentDetectionService()
      const environment = environmentService.detectEnvironment()
      const environmentDisplayName = getEnvironmentDisplayName(environment)
      console.error(
        `MCP server started successfully in ${environmentDisplayName} environment (stdio)`
      )

      if (isDevelopmentLike(environment)) {
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
