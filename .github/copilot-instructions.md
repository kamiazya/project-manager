# GitHub Copilot Instructions

This file provides specific instructions for GitHub Copilot when working with the Project Manager codebase.

## Project Overview

Project Manager is a local-first ticket management system designed for AI-driven development workflows. It enables effective collaboration between developers and AI assistants through issue-based development.

### Core Architecture

- **CLI-First Design**: Primary interface through command-line tools
- **MCP Server**: Model Context Protocol server for AI integration
- **Local-First**: All core functionality works offline
- **TypeScript**: Full type safety across all packages
- **Monorepo**: pnpm workspaces with multiple packages

## Context and Documentation

### Key Documentation Files

When suggesting changes, always reference these files for context:

- `README.md` - Project overview and quick start
- `CLAUDE.md` - AI assistant instructions and workflows
- `CONTRIBUTING.md` - Development process and guidelines
- `docs/reference/architecture.md` - System architecture
- `docs/explanation/domain-overview.md` - Business domain concepts
- `docs/guides/` - Development guides and best practices

## Suggestions and Best Practices

### When Suggesting Code

1. **Follow existing patterns**: Look at similar implementations in the codebase
2. **Add comprehensive tests**: Include unit and integration tests
3. **Update documentation**: Modify relevant docs when adding features
4. **Consider AI integration**: Think about MCP tool exposure for new features

### Common Patterns to Follow

- Use factory methods for entity creation
- Implement proper validation with Zod schemas
- Use dependency injection for services
- Follow the repository pattern for data access
- Use command pattern for CLI operations
- Implement proper logging with structured output

### Performance Considerations

- Use async/await consistently
- Implement proper caching for expensive operations
- Use streaming for large data sets
- Consider pagination for list operations
- Implement proper connection pooling for external APIs

This instruction file helps GitHub Copilot understand the project structure, patterns, and conventions to generate more accurate and consistent code suggestions.
