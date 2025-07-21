# Project Manager MCP Server

Model Context Protocol server for AI-assisted development workflows with project-manager.

## Features

- **Ticket Management**: Create, read, update, and search tickets
- **Project Configuration**: Get and set project configuration settings
- **Project Information**: Get basic project information including README and package.json
- **Statistics**: Get project statistics and progress tracking
- **Hot Reload**: Development mode with automatic restart on file changes
- **Type Safety**: Full TypeScript support with Zod validation

## Available Tools

### Ticket Management

#### Core Operations

- `create_ticket`: Create a new ticket with title, description, priority, and type
- `get_ticket_by_id`: Get a specific ticket by its ID
- `delete_ticket`: Delete a ticket by its ID
- `search_tickets`: Search tickets by title or description

#### Update Operations (1 Use Case = 1 Tool)

- `update_ticket_status`: Update the status of a ticket (pending, in_progress, completed, archived)
- `update_ticket_priority`: Update the priority level of a ticket (high, medium, low)
- `update_ticket_content`: Update the title and/or description of a ticket

### Project Management

- `get_project_config`: Get current project configuration settings
- `set_project_config`: Set project configuration values
- `get_project_info`: Get basic project information

## Development

### Quick Start

Start the MCP server in development mode with hot reload:

```bash
# From project root (development mode with intelligent hot reload)
pnpm pm-mcp-server

# Explicit development mode
NODE_ENV=development pnpm pm-mcp-server

# Or directly in this package
pnpm run dev
```

**Note**: When `NODE_ENV=development` is set, the server automatically enables hot reload with:

- **Intelligent Environment Detection**: Automatically enables hot reload in development
- **Debounced Restarts**: 300ms delay prevents excessive restarts from multiple file changes
- **Colorful Logs**: Easy-to-read output with color-coded messages
- **Graceful Shutdown**: 2-second timeout before force-killing processes
- **Error Recovery**: Automatic restart on crashes with detailed error messages

### Development Commands

```bash
# Hot reload with tsx (recommended for development)
pnpm run dev

# TypeScript compilation watch mode
pnpm run dev:build

# Build for production
pnpm run build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Development Workflow

1. **Start development server**: Run `NODE_ENV=development pm --mcp` or `pnpm run dev`
2. **Make changes**: Edit any file in the `src/` directory
3. **Automatic restart**: The server will automatically restart when files change
4. **See changes**: Test your changes immediately without manual restart

### Development Features

- **File Watching**: Monitors all `.ts`, `.js`, and `.json` files in `src/`
- **Fast Restart**: Uses tsx for fast TypeScript execution
- **Signal Handling**: Proper cleanup on SIGINT/SIGTERM
- **PID Tracking**: Tracks process ID for development tools
- **Verbose Logging**: Development-specific logging for debugging

## Production

Start the MCP server in production mode:

```bash
# From project root
pm --mcp

# Or using the built binary
node dist/bin/mcp-server.js
```

## Using with Claude

### Setup

1. **Start the MCP server**:

   ```bash
   # For development (with hot reload)
   NODE_ENV=development pm --mcp

   # For production
   pm --mcp
   ```

2. **Configure Claude to use the MCP server**:
   - The server communicates via stdio (standard input/output)
   - Server name: `project-manager-mcp`
   - Available tools: See "Available Tools" section below

### Example Usage

Once connected to Claude, you can use commands like:

- **Create a ticket**: "Create a new ticket titled 'Fix login bug' with high priority"
- **List tickets**: "Show me all pending tickets"
- **Get project info**: "What is this project about?"
- **Update ticket status**: "Mark ticket [ID] as in progress"
- **Search tickets**: "Find all tickets related to authentication"
- **Get statistics**: "Show me project statistics"

### Integration Benefits

- **Context Awareness**: Claude can understand your project structure and current tickets
- **Workflow Automation**: Automate ticket creation and status updates during development
- **Project Insights**: Get real-time project statistics and progress tracking
- **Configuration Management**: Adjust project settings through natural language

### Tool Parameters

All tools use Zod validation for type-safe parameters. See individual tool files in `src/tools/` for detailed schemas.

## Configuration

### Development Configuration

The development environment can be customized via:

- Environment variable `NODE_ENV=development`
- Custom development helpers in `src/utils/dev-helpers.ts`

### Hot Reload Settings

Hot reload is handled by `tsx watch` which automatically restarts when TypeScript files change.

## Architecture

- **Server**: MCP server using @modelcontextprotocol/sdk
- **Tools**: Individual tool implementations with Zod validation
- **Core Integration**: Direct integration with @project-manager/core
- **Error Handling**: Centralized error handling and logging

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test src/tools/create-ticket.test.ts
```

## Troubleshooting

### Development Mode Issues

1. **Server won't restart**: Check if PID file exists (`.dev-server.pid`)
2. **Port conflicts**: Ensure no other MCP servers are running
3. **File watch not working**: Check file permissions and tsx watch configuration

### Performance

- **tsx watch**: Used by default for fast startup and TypeScript support
- **File watching**: Only watches relevant file types to improve performance

## Contributing

1. Make changes in development mode (`NODE_ENV=development pm --mcp`)
2. Test changes with hot reload
3. Run tests before committing
4. Update documentation if needed

## License

See the main project [LICENSE](https://github.com/kamiazya/project-manager/blob/main/LICENSE) file.
