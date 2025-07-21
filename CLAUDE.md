# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Project Manager is a local-first ticket management system designed to enable effective collaboration between developers and AI assistants through issue-based development workflows.

### Core Purpose

- **AI Collaboration**: Prevent context loss and maintain focus on primary objectives when working with AI assistants
- **Shared Understanding**: Create a single source of truth for human developers and multiple AI systems
- **Shift-Left Development**: Move quality assurance and design decisions earlier through issue-based workflows
- **Pre-Implementation Review**: Document and validate approaches before coding begins

### Architecture

The system implements Clean Architecture with local-first approach and external integration capabilities:

- **Clean Architecture**: Domain-driven design with strict layer separation (Domain → Application → Infrastructure)
- **SDK Layer**: Facade pattern providing unified API access (`packages/sdk`)
- **Local Ticket Management**: Full CRUD operations using Clean Architecture patterns
- **CLI Application**: Command-line interface in `apps/cli` with service layer integration
- **MCP Server**: Model Context Protocol server in `apps/mcp-server` for AI integration
- **Layered Packages**: Domain (`packages/domain`), Application (`packages/application`), Infrastructure (`packages/infrastructure`)
- **External Sync**: External tool-based synchronization with GitHub Issues, Jira, and other project management tools

### Target Users

- **AI-Driven Developers**: Those using AI assistants as primary development partners
- **International Engineers**: Engineers working in foreign companies who want to focus on engineering without language barriers
- **OSS Contributors**: Non-English native speakers contributing to international open source projects
- **Distributed Teams**: Teams needing to coordinate between multiple AI systems and human developers

### Current Status

- ✅ **Domain Layer**: Rich domain models with business logic encapsulation
- ✅ **Application Layer**: Use cases with single responsibility principle
- ✅ **Infrastructure Layer**: Repository implementations and external adapters
- ✅ **SDK Layer**: Facade pattern for unified API access
- ✅ **Applications**: CLI and MCP server as separate applications
- ✅ **Monorepo Structure**: Organized packages and applications with pnpm workspaces

## Language and Communication Policy

**Official Project Language**: English

- All project documentation, code, comments, and public-facing content must be in English
- This ensures international accessibility and team collaboration
- Exception: User-specific local configuration files (e.g., CLAUDE.local.md)

**AI Interaction Language**: Follows user preference

- Claude Code interactions may be conducted in the user's preferred language
- Local development notes and personal workflow instructions can be in any language
- This balances project accessibility with user productivity

## Important Notes for Claude Code

### Import Notation (@)

- The `@` import notation (e.g., `@docs/ARCHITECTURE.md`) is **ONLY** valid within CLAUDE.md
- In all other Markdown files, use standard Markdown links: `[text](./path/to/file.md)`
- This is because the @ notation is specific to Claude Code's context system

### Documentation Best Practices

- Keep cross-cutting concerns (like testing strategies) in dedicated documents rather than scattered across multiple files
- Minimize mentions of specific methodologies in general documents to avoid maintenance burden
- Use minimal descriptions with links to detailed documents for maintainability

### Design vs Requirements

- **Requirements**: User-facing features and capabilities
- **Design/Strategy**: Internal implementation approaches (e.g., dogfooding, testing strategies)
- Keep these concerns separated in different documents

### Architecture Decision Records (ADRs)

- **Purpose**: Document architectural decisions with context, rationale, and consequences
- **Location**: `/docs/explanation/adr/` directory with numbered files (e.g., `0001-record-architecture-decisions.md`)
- **When to Create**: For decisions that cross bounded contexts, introduce new technologies, define major interfaces, or impact system qualities
- **Integration**: ADRs should be created during the design proposal phase of issues involving architectural decisions
- **Template**: Use `/docs/explanation/adr/TEMPLATE.md` for consistent structure
- **Review**: Include ADR review in AI expert validation phase

#### Key Principles from ADRs

- **Standards-First**: Adopt industry standards (XDG Base Directory, OAuth 2.0, OpenAPI, etc.) over custom implementations
- **CLI-First**: Build CLI as the primary interface to core business logic, with other interfaces (TUI, MCP server) launched via CLI
- **Diagrams-First**: Use Mermaid diagrams for clear visual communication in documentation
- **Context-Aware**: Support both global and project-specific contexts with appropriate precedence

### Task Management Approach

#### Core Principles

- Use **issue-based tickets** with background and purpose (not just simple task lists)
- Structure: Issues contain multiple TODOs as subtasks
- Local temporary issue management before promoting to GitHub Issues
- Purpose: Organize and batch issues before creating permanent GitHub Issues

#### AI Dogfooding and Integration with Project Manager

AI assistants working on this project MUST use the project-manager system itself for task management and planning. This ensures that the AI systems are effectively integrated into the development workflow and can self-manage their tasks while providing real-time updates to human collaborators.

**Definition of Non-Trivial Work**: Tasks requiring multiple steps, file modifications, or taking more than 5 minutes to complete.

**AI Task Management and Integration Requirements**:

1. **Create Tickets for All Non-Trivial Work**
   - Before starting any complex task, create a ticket using the CLI
   - Document the purpose, background, and success criteria
   - Use appropriate priority and complexity levels

2. **Use Development Aliases for Efficiency**
   - Load aliases: `source pm-dev-alias.sh`
   - Use `pnpm pm` commands directly for reliability
   - Note: Aliases may not persist in all environments

3. **Real-time Status Updates**
   - Mark tickets as in_progress when starting work
   - Add progress updates via new tickets
   - Create new tickets for unexpected issues or requirements
   - Complete tickets promptly when work is finished

4. **Planning and Coordination**
   - Use `pnpm pm quick todo` to check work queue before starting
   - Use `pnpm pm quick wip` to track current active work
   - Create dependent tickets for complex multi-step tasks
   - Use epics for large initiatives requiring multiple tickets

**AI Dogfooding Examples**:

```bash
# Before starting feature implementation
pnpm pm create "Implement user authentication system" -d "Add login/logout with JWT tokens" -p h --type feature
# Note: Capture the ticket ID from the output for use in subsequent commands

# Start work on the ticket (use actual ticket ID from above)
pnpm pm quick start 1751764474

# Add progress updates through new tickets
pnpm pm create "Progress on #1751764474: JWT library research" -d "Researched JWT libraries, selected jsonwebtoken for implementation" -p l --type task

# Create dependent tickets as needed
pnpm pm create "Design authentication middleware" -d "Create Express middleware for JWT validation" -p m --depends-on 1751764474

# Complete when finished
pnpm pm quick done 1751764474
```

**AI Self-Validation Process**:

1. **Pre-Implementation Planning**
   - Create ticket with clear success criteria
   - Document approach and alternatives considered
   - Identify potential risks and dependencies

2. **Implementation Tracking**
   - Update ticket status as work progresses
   - Document decisions and learnings in progress tickets
   - Create new tickets for discovered issues

3. **Completion Validation**
   - Verify all success criteria met
   - Document results and any deviations
   - Create follow-up tickets if needed

**AI Responsibility for Dogfooding**:

As an AI assistant working on this project, you are responsible for:

1. **Using the system consistently** - Don't bypass project-manager for task management
2. **Providing authentic feedback** - Report usability issues and improvement opportunities through tickets
3. **Maintaining real data** - Create realistic tickets with proper context and complexity
4. **Following actual workflows** - Use the system as intended users would
5. **Contributing to improvement** - Create tickets for system enhancements based on usage experience

**Benefits of AI Self-Management**:

- **Authentic Testing**: AI experiences the system as actual users would
- **Continuous Improvement**: AI identifies usability issues through real use
- **Knowledge Retention**: Important decisions and context preserved in tickets
- **Collaboration**: Human developers can track AI progress and provide feedback
- **Quality Assurance**: Systematic approach ensures nothing is overlooked

#### When to Use Issue Management

**Always Use Issues For:**

- **Any non-trivial task** requiring multiple steps or files
- **File modifications** that affect project structure or functionality
- **New feature development** or significant changes
- **Bug fixes** that require investigation or testing
- **Documentation updates** affecting multiple files
- **Configuration changes** that impact development workflow
- **Refactoring** or code quality improvements
- **Research tasks** requiring investigation and documentation

**Simple Tasks That Still Benefit from Issues:**

- **Single file edits** with clear purpose (easier tracking and learning)
- **Quick fixes** that might reveal larger problems
- **Dependency updates** that could affect other components
- **Tool configuration** changes (linting, formatting, etc.)
- **Script additions** or modifications
- **README updates** or documentation corrections

**Optional for Issues (Use TodoWrite instead):**

- **Immediate clarification questions** without file changes
- **Simple file reading** for understanding current state
- **Basic status checks** or information gathering
- **Trivial typo fixes** in single locations

#### Issue Creation Guidelines

**Minimum Information Required:**

- **Clear title** describing the task or problem
- **Background context** explaining why this is needed
- **Success criteria** defining what "done" looks like
- **Estimated complexity** (simple/medium/complex)

**For Simple Tasks:**

- Create issue with minimal but clear description
- Use priority "low" for non-blocking tasks
- Set status to "in_progress" immediately if starting work
- Complete promptly to avoid accumulation

**For Complex Tasks:**

- Use enhanced workflow with design proposals
- Seek AI expert validation when appropriate
- Document decisions and alternatives considered
- Update progress regularly in issue files

#### Effective Task Structuring for Asynchronous Work

When creating tasks that will be executed asynchronously (by AI agents, remote developers, or new contributors), proper structure is essential for success.

For detailed guidelines and examples, see [Asynchronous Delegation Best Practices](@docs/guides/asynchronous-delegation.md).

**Key Points for AI Agents:**

- Use extreme precision with literal specifications
- Include concrete examples and test cases
- Define exact file paths and function signatures
- Provide self-contained validation criteria

**Remember:** Well-structured tasks lead to higher success rates and less rework, regardless of who executes them.

**AI Feedback Mechanism**:

When encountering usability issues or improvement opportunities, create specific improvement tickets:

```bash
# Report usability issues
pnpm pm create "Improve clarity of pm-todo output" -d "Current output format difficult to scan quickly" -p m --type improvement

# Suggest enhancements
pnpm pm create "Add ticket template support" -d "Common ticket patterns need templates for efficiency" -p l --type enhancement
```

**Error Handling Protocol**:

If project-manager CLI commands fail during the workflow:

1. **Document the error**: Note the exact command and error message
2. **Create a bug ticket**: `pnpm pm create "CLI command error: [command]" -d "Error details and reproduction steps" -p h --type bug`
3. **Use fallback method**: Continue with manual tracking until the issue is resolved
4. **Report to human developer**: Mention the error and ticket ID for immediate attention

**Known Limitations (From Validation Testing)**:

1. **Development Aliases**: May not persist across bash sessions in some environments
2. **Comment Command**: Not yet implemented - use progress tickets as workaround
3. **Ticket ID Management**: Must manually capture and track ticket IDs from command output

### Local Development Workflow

The project has a comprehensive development workflow with hot-reload capabilities and efficient tooling. See the [Development Commands](#development-commands) section above for detailed CLI usage, MCP server development, and performance optimization techniques.

**Key Development Patterns**:

- **Hot-reload Development**: `pnpm pm-mcp-server` for MCP server with file watching
- **Direct TypeScript Execution**: `pnpm pm` commands via tsx for immediate feedback
- **Comprehensive Testing**: `pnpm run test` with complete test coverage across all layers
- **Type Safety**: `pnpm run typecheck` for strict TypeScript validation
- **Development vs Production**: Clear separation with environment-based configurations

## Development Process Guidelines

This project follows an integrated AI-driven development approach. See the [Contributing Guide](./CONTRIBUTING.md) for comprehensive development process details.

### Key Development Principles

- **AI-Assisted Development**: Leverage AI tools for efficient collaboration
- **Issue-Based Workflow**: All development organized around tickets and epics
- **Pre-Implementation Review**: Validate approaches before coding
- **Document-Driven**: Specifications before implementation

### Pre-Implementation Verification Process

**Mandatory Steps**: Before creating or modifying any files, follow this process:

1. **Approach Explanation**: Clearly explain the implementation approach, rationale, and expected outcomes
2. **Change Overview**: Provide detailed summary of specific changes, additions, or modifications
3. **Impact Assessment**: Identify potential risks, dependencies, and effects on existing functionality
4. **Approval Confirmation**: Obtain explicit approval from stakeholders before proceeding
5. **Completion Report**: Document results and any deviations from the original plan

**Purpose**:

- Prevent misalignment between intentions and implementation
- Enable early detection of design flaws and potential issues
- Ensure all stakeholders understand the scope and impact of changes
- Maintain project coherence and quality standards

### AI-Assisted Quality Assurance

**Second Opinion Principle**: Leverage multiple AI systems for independent validation and critical evaluation. See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed AI interaction guidelines and best practices.

**AI Safety Guidelines**:

- **Destructive Operation Safeguards**: AI requires user confirmation before executing potentially destructive operations (file deletion, bulk overwrites)
- **Operation Risk Assessment**: Operations are categorized by risk level to determine appropriate safeguards
- **Co-authorship Model**: All AI operations record both the AI agent and human instructor following Git-style co-authorship
- **AI-Optional Design**: All core functionality works without AI assistance

**AI Dogfooding Integration**:

- **Mandatory Self-Use**: AI assistants must use project-manager for their own task management
- **Authentic Testing**: AI experiences system limitations and benefits firsthand
- **Continuous Feedback**: AI creates tickets for usability improvements based on real usage
- **Knowledge Retention**: AI preserves context and decisions through ticket documentation
- **Quality Validation**: AI validates system quality through consistent practical application

## Architecture and Design

The system follows a local-first architecture with AI integration capabilities. See @docs/reference/architecture.md for comprehensive architectural details.

### Domain-Driven Design (DDD) Approach

The project adopts DDD principles for modeling complex business logic:

- **Bounded Context**: "Ticket Management" as the primary context
- **Entities**: Rich domain objects with encapsulated business rules (Ticket, Epic, Project)
- **Value Objects**: Domain-specific types replacing primitives for better type safety
- **Domain Services**: Stateless operations for cross-entity logic
- **Repository Pattern**: Clean abstractions shielding domain from infrastructure

When implementing features:

1. Focus on domain language - use business terms consistently
2. Encapsulate business rules within entities, not in services
3. Use factory methods for entity creation
4. Keep infrastructure concerns out of domain layer
5. See @docs/guides/coding-guidelines.md for detailed implementation guidelines

## Use Cases and Target Users

The framework serves multiple personas from package developers to team leads. For detailed use cases and user scenarios, see:

- [Domain Overview](./docs/explanation/domain-overview.md) - Core domain concepts and user personas
- [User Stories](./docs/explanation/user-stories.md) - Detailed user scenarios and workflows
- [Requirements](./docs/explanation/requirements.md) - Functional and non-functional requirements
- [Target Users](#target-users) section in README.md - Primary user segments

## Development Status

**Current Status**: Clean Architecture implementation complete with comprehensive testing infrastructure.

**Completed Implementation**:

- ✅ **Clean Architecture Migration**: Successfully implemented with comprehensive test coverage
- ✅ **Domain Layer**: Rich domain models with encapsulated business logic
- ✅ **Application Layer**: Use cases following single responsibility principle
- ✅ **Infrastructure Layer**: Repository implementations with XDG-compliant configuration
- ✅ **SDK Layer**: Facade pattern for unified API access with dependency injection
- ✅ **CLI Application**: Full CRUD operations with service layer integration
- ✅ **MCP Server**: AI integration with 9 tools and hot-reload development
- ✅ **Testing Infrastructure**: Comprehensive unit, integration, and CLI testing

**Current Focus**: Enhancing domain features and AI collaboration capabilities. See [README.md](./README.md) for detailed development status and roadmap.

## Technology Stack

### Current Implementation

- **Node.js**: Primary runtime environment with ES modules
- **TypeScript**: Comprehensive type safety across all packages
- **pnpm**: Monorepo package management with workspaces
- **Commander.js**: CLI framework for structured command hierarchies
- **tsx**: Direct TypeScript execution for development efficiency

### Development Tools

- **Template System**: File-based templates with JSON configuration
- **Logging**: Unified chalk-based logging with structured output
- **Content Input**: Multi-modal content input (CLI args, files, editor, stdin)
- **Type Safety**: Strict TypeScript with comprehensive error handling

## Testing Strategy

Comprehensive Test-Driven Development approach with AI-assisted testing. See @docs/guides/testing-strategy.md for detailed testing guidelines and implementation.

### Dogfooding Testing

The project uses dogfooding as a core testing strategy - using project-manager to manage its own development. This validates real-world usage patterns and ensures the system meets actual developer needs through practical application.

## Development Commands

> **Development Tips**: For advanced development efficiency tips including hot-reload setup and performance optimization, see @docs/guides/development-tips.md

### Package Management

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Type check all packages
pnpm run typecheck
```

### CLI Development

**Fast Development (tsx - no build required)**

```bash
# Direct tsx execution from monorepo root (recommended for development)
pnpm pm <command>                     # Run CLI directly via apps/cli
pnpm pm create "Task" -p h            # Create high-priority task
pnpm pm quick todo                    # List pending tickets
pnpm pm quick wip                     # List work-in-progress
pnpm pm quick start <ticket-id>       # Start working on ticket
pnpm pm quick done <ticket-id>        # Complete ticket

# SDK usage in TypeScript projects
import { createProjectManagerSDK } from '@project-manager/sdk'
const sdk = await createProjectManagerSDK({ environment: 'development' })
const ticket = await sdk.tickets.create({ title: 'New feature', description: 'Details' })
```

### MCP Server Development

**Hot Reload Development (recommended for MCP server development)**

```bash
# Development mode with intelligent hot reload (from monorepo root)
pnpm pm-mcp-server                    # Auto-detects NODE_ENV, enables hot reload

# Explicit development mode (same as above)
NODE_ENV=development pnpm pm-mcp-server

# Production mode (no hot reload)
NODE_ENV=production pnpm pm-mcp-server

# Direct development from apps/mcp-server
cd apps/mcp-server
pnpm dev                              # Hot reload development
pnpm build && node dist/bin/mcp-server.js  # Production testing
```

**Features:**

- ✅ **Intelligent Environment Detection**: Automatically enables hot reload in development
- ✅ **Debounced Restarts**: 300ms delay prevents excessive restarts from multiple file changes
- ✅ **Colorful Logs**: Easy-to-read output with color-coded messages
- ✅ **Graceful Shutdown**: 2-second timeout before force-killing processes
- ✅ **Error Recovery**: Automatic restart on crashes with detailed error messages
- ✅ **File Change Tracking**: Shows exactly which files triggered restarts

**Production Testing (build required)**

```bash
# Build all packages and test CLI
pnpm run build
node apps/cli/dist/bin/run.js <command>

# Test specific applications
cd apps/cli && pnpm build && node dist/bin/run.js <command>
cd apps/mcp-server && pnpm build && node dist/bin/mcp-server.js
```

**Performance Comparison**

- **tsx execution**: ~1 second (development)
- **build + run**: ~11 seconds (production testing)
- **Speed improvement**: 10x faster for development

## README.md Maintenance Guidelines

**Marketing and User-Facing Content Policy**: README.md serves as both technical documentation and marketing material. It must always contain the most current and user-valuable information.

**Critical Maintenance Requirements**:

- **Always keep user benefits current**: Update value propositions, key features, and target users as the project evolves
- **Minimize maintenance burden**: Use "TODO" placeholders for detailed sections that change frequently
- **Prioritize user experience**: Structure content for quick scanning and progressive disclosure
- **Maintain marketing value**: README.md is often the first impression - ensure it accurately reflects current capabilities and vision

**Update Triggers**:

- Major feature additions or architectural changes
- New target user segments or use cases
- Changes to value propositions or competitive advantages
- Implementation milestones that affect user experience
- Significant documentation structure changes

**Content Priority Order**:

1. **What is project-manager?** - Core value proposition and problem solving
2. **Key Features** - Current and planned capabilities
3. **Target Users** - Primary personas and use cases
4. **Documentation Index** - Navigation to detailed resources
5. **Development Status** - Current implementation state
6. **Other sections** - Use TODO placeholders for low-priority or frequently changing content

## Clean Architecture Package Structure

The project now follows Clean Architecture with the following package organization:

```
project-manager/
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

### Layer Dependencies

- **Domain** (`packages/domain`): No dependencies on other layers
- **Application** (`packages/application`): Depends only on Domain and Base
- **Infrastructure** (`packages/infrastructure`): Implements Application interfaces
- **SDK** (`packages/sdk`): Facade over Application layer
- **Apps** (`apps/`): Use SDK or Application layer directly
