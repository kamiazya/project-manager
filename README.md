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

- ✅ **Clean Architecture Implementation**: Domain-driven design with clear separation of concerns
- ✅ **Local ticket management**: Full CRUD operations with Clean Architecture patterns
- ✅ **CLI Application**: Developer-friendly command-line interface (apps/cli)
- ✅ **MCP Server**: Model Context Protocol server for AI integration (apps/mcp-server)
  - 9 AI integration tools
  - Hot reload development mode
  - Real-time project context sharing
- ✅ **TypeScript SDK**: Facade pattern for unified API access (packages/sdk)
- ✅ **Layered Architecture**: Domain, Application, Infrastructure separation
- ✅ **Dependency Injection**: Inversify-based DI container for Clean Architecture
- ✅ **Project configuration management**: XDG-compliant configuration
- ✅ **Language-aware workflows**: Native language development with AI bridging

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

🎉 **Clean Architecture Implementation Complete** - Migration to Clean Architecture successfully completed!

### Architecture Achievements

- ✅ **Clean Architecture**: Domain-driven design with proper layer separation
- ✅ **Monorepo Structure**: Organized packages and applications
- ✅ **Test Coverage**: 913/915 tests passing (99.8% success rate)
- ✅ **SDK Package**: Facade pattern for unified API access
- ✅ **Dependency Injection**: Proper IoC container implementation
- ✅ **Apps Structure**: CLI and MCP server as separate applications

### Completed Features

- ✅ **Domain Layer**: Rich domain models with business logic encapsulation
- ✅ **Application Layer**: Use cases with Clean Architecture patterns
- ✅ **Infrastructure Layer**: Repository implementations and external adapters
- ✅ **CLI Application**: Full CRUD operations with service layer
- ✅ **MCP Server**: 9 AI integration tools with hot reload
- ✅ **TypeScript SDK**: Unified API with Facade pattern
- ✅ **Project configuration**: XDG-compliant configuration management

### Current Focus

- ✅ **Clean Architecture Migration Completed**: Successfully migrated to Clean Architecture
- Epic and roadmap management features
- External system integration (GitHub Issues, Jira)
- Advanced AI collaboration protocols

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

### SDK Usage (TypeScript)

```typescript
import { createProjectManagerSDK } from '@project-manager/sdk'

// Create SDK instance
const sdk = await createProjectManagerSDK({
  storagePath: './my-project-data',
  environment: 'development'
})

// Use the SDK
const ticket = await sdk.tickets.create({
  title: 'Implement user authentication',
  description: 'Add JWT-based authentication',
  priority: 'high',
  type: 'feature'
})

const allTickets = await sdk.tickets.getAll()
const stats = await sdk.tickets.getStats()
```

### MCP Server for AI Integration

```bash
# Start MCP server (from monorepo root)
pnpm pm-mcp-server             # Development mode with hot reload
NODE_ENV=production pnpm pm-mcp-server  # Production mode

# Or run directly from apps directory
cd apps/mcp-server
pnpm dev                       # Development mode
pnpm build && node dist/bin/mcp-server.js  # Production mode
```

The MCP server provides 9 tools for AI integration:

- Ticket management (create, read, update, search, stats)
- Project configuration management
- Project information retrieval

See [MCP Server README](./apps/mcp-server/README.md) for detailed AI integration instructions.

## Project Structure

The project follows Clean Architecture principles with clear separation of concerns:

```
├── apps/                    # Applications (final deliverables)
│   ├── cli/                 # CLI application
│   └── mcp-server/          # MCP server for AI integration
└── packages/                # Libraries and shared code
    ├── base/                # Foundation package (configuration, types)
    ├── domain/              # Domain layer (entities, value objects)
    ├── application/         # Application layer (use cases, interfaces)
    ├── infrastructure/      # Infrastructure layer (repositories, adapters)
    ├── sdk/                 # TypeScript SDK with Facade pattern
    └── shared/              # Shared utilities and types
```

### Architecture Layers

- **Domain Layer** (`packages/domain`): Core business logic, entities, and value objects
- **Application Layer** (`packages/application`): Use cases, repository interfaces, and application services
- **Infrastructure Layer** (`packages/infrastructure`): Repository implementations, external adapters
- **SDK Layer** (`packages/sdk`): Unified API facade for external consumers
- **Applications** (`apps/`): CLI and MCP server applications using the layered architecture

## Contributing

We welcome contributions! Please start with [CONTRIBUTING.md](./CONTRIBUTING.md) which contains:

- Development process and methodologies
- Issue management guidelines
- Code standards and testing requirements
- AI integration workflows
- Review process and quality gates

For AI assistant integration, also check [CLAUDE.md](./CLAUDE.md).

## License

See the main project [LICENSE](https://github.com/kamiazya/project-manager/blob/main/LICENSE) file.
