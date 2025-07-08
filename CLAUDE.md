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
The system follows a local-first approach with external integration capabilities:
- **Local Ticket Management**: Full CRUD operations for tickets, epics, and roadmaps
- **CLI Interface**: Command-line tools for developer productivity
- **MCP Server**: Model Context Protocol implementation for AI integration
- **External Sync**: External tool-based synchronization with GitHub Issues, Jira, and other project management tools

### Target Users
- **AI-Driven Developers**: Those using AI assistants as primary development partners
- **International Engineers**: Engineers working in foreign companies who want to focus on engineering without language barriers
- **OSS Contributors**: Non-English native speakers contributing to international open source projects
- **Distributed Teams**: Teams needing to coordinate between multiple AI systems and human developers

### Current Status
The project is in early development phase with comprehensive requirements and architecture documentation completed. Implementation is planned to begin with the core CLI interface and local ticket management system.

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
- **Location**: `/docs/adr/` directory with numbered files (e.g., `0001-record-architecture-decisions.md`)
- **When to Create**: For decisions that cross bounded contexts, introduce new technologies, define major interfaces, or impact system qualities
- **Integration**: ADRs should be created during the design proposal phase of issues involving architectural decisions
- **Template**: Use `/docs/architecture/adr/TEMPLATE.md` for consistent structure
- **Review**: Include ADR review in AI expert validation phase

### Task Management Approach

#### Core Principles
- Use **issue-based tickets** with background and purpose (not just simple task lists)
- Structure: Issues contain multiple TODOs as subtasks
- Local temporary issue management before promoting to GitHub Issues
- Purpose: Organize and batch issues before creating permanent GitHub Issues

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

For detailed guidelines and examples, see [Asynchronous Delegation Best Practices](@docs/best-practices/asynchronous-delegation.md).

**Key Points for AI Agents:**
- Use extreme precision with literal specifications
- Include concrete examples and test cases
- Define exact file paths and function signatures
- Provide self-contained validation criteria

**Remember:** Well-structured tasks lead to higher success rates and less rework, regardless of who executes them.

### Local Development Workflow

TODO: Define local development workflow for project-manager

## Development Process Guidelines

This project follows an integrated AI-driven development approach. See @docs/DEVELOPMENT_PROCESS.md for comprehensive details.

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


## Architecture and Design

The system follows a local-first architecture with AI integration capabilities. See @docs/architecture/ARCHITECTURE.md for comprehensive architectural details.

## Use Cases and Target Users

The framework serves multiple personas from package developers to team leads.

<!-- TODO: Create USECASE.md document -->

## Development Status

TODO: Update development status for project-manager

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

Comprehensive Test-Driven Development approach with AI-assisted testing. See @docs/TEST_STRATEGY.md for detailed testing guidelines and implementation.

## Development Commands

### Package Management
```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Type check all packages
pnpm run typecheck
```




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
