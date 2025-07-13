# [TBD] Project Manager

A local-first ticket management system designed for AI-driven development, enabling seamless collaboration between developers and multiple AI assistants while supporting native language development workflows.

## What is Project Manager

Project Manager is an open-source tool that enables effective collaboration between developers and AI assistants through issue-based development:

- **Context Preservation**: Maintains shared understanding across human developers and multiple AI systems
- **Shift-Left Development**: Promotes early quality assurance through issue-based workflows and pre-implementation reviews
- **Multi-AI Collaboration**: Enables different AI systems (Claude, Gemini, etc.) to work from the same project context
- **Implementation Planning**: Documents and validates technical approaches before coding begins
- **External Integration**: Syncs with GitHub Issues, Jira, and other project management tools

## Key Features

### Current

- ✅ Local ticket management (CRUD operations)
- ✅ CLI for developer productivity
- ✅ MCP (Model Context Protocol) server for AI integration
  - Ticket management tools
  - Project configuration management
  - Hot reload development mode
- ✅ Project configuration management
- Language-aware workflows (local native language, remote project language)
- AI-powered language bridging (through MCP and integrated AI services)

### Planned

- 🔄 Epic and roadmap management
- 🔄 Multi-AI collaboration protocols
- 🔄 External ticket system synchronization (GitHub Issues, Jira, etc.)
- 🔄 Implementation plan templates and review workflows
- 🔄 Project milestone and priority visualization
- 🔄 Native language workflow support (translation capabilities through AI integration, not built-in)

## Target Users

- **AI-Driven Developers**: Those using AI assistants as primary development partners
- **International Engineers**: Engineers working in foreign companies who want to focus on engineering without language barriers
- **OSS Contributors**: Non-English native speakers contributing to international open source projects
- **Distributed Teams**: Teams needing to coordinate between multiple AI systems and human developers
- **Engineering Teams**: Teams wanting to leverage their native language for better problem-solving while maintaining project standards

## Documentation

### Core Documentation

- [Architecture Reference](./docs/reference/architecture.md) - System architecture and design principles
- [Domain Overview](./docs/explanation/domain-overview.md) - Business domain, requirements, and user scenarios
- [Testing Strategy](./docs/guides/testing-strategy.md) - Comprehensive testing approach

### Development Guidelines

- [CONTRIBUTING.md](./CONTRIBUTING.md) - **Start here for contributors** - Development process, coding standards, and workflow guidelines
- [Development Tips](./docs/guides/development-tips.md) - Efficiency tips, hot-reload setup, and performance optimization
- [CLAUDE.md](./CLAUDE.md) - AI assistant project instructions
- [Architecture Decision Records](./docs/explanation/adr/README.md) - Architectural decisions and rationale

## Development Status

🔨 **Active Development** - Core features implemented and functional

### Completed Features

- ✅ Local ticket management system
- ✅ CLI with full CRUD operations
- ✅ MCP server for AI integration (9 tools available)
- ✅ Project configuration management
- ✅ Hot reload development workflow

### Current Focus

- Expanding MCP tool capabilities
- Improving AI integration workflows
- Documentation and usability enhancements

## Quick Start

### Basic CLI Usage

```bash
# Install dependencies
pnpm install

# Create a new ticket
pnpm pm new "Fix login bug" -d "Users cannot login with email" -p h

# List tickets
pnpm pm todo

# Start working on a ticket
pnpm pm start <ticket-id>

# Complete a ticket
pnpm pm done <ticket-id>
```

### MCP Server for AI Integration

```bash
# Start MCP server for AI integration

# Unix/Linux/macOS
NODE_ENV=development pm --mcp  # Development mode with hot reload

# Windows (Command Prompt)
set NODE_ENV=development && pm --mcp

# Windows (PowerShell)
$env:NODE_ENV="development"; pm --mcp

# Cross-platform (using cross-env - recommended)
npx cross-env NODE_ENV=development pm --mcp

# Production mode (all platforms)
pm --mcp

# Or from the MCP server package
cd packages/mcp-server
pnpm dev                       # Development mode
pnpm build && node dist/bin/mcp-server.js  # Production mode
```

The MCP server provides 9 tools for AI integration:

- Ticket management (create, read, update, search, stats)
- Project configuration management
- Project information retrieval

See [MCP Server README](./packages/mcp-server/README.md) for detailed usage instructions.

## Contributing

We welcome contributions! Please start with [CONTRIBUTING.md](./CONTRIBUTING.md) which contains:

- Development process and methodologies
- Issue management guidelines
- Code standards and testing requirements
- AI integration workflows
- Review process and quality gates

For AI assistant integration, also check [CLAUDE.md](./CLAUDE.md).

## License

License to be determined - currently under evaluation for open source licensing options.
