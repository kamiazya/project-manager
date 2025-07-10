# Architecture Documentation

This directory contains technical architecture documentation for the Project Manager system, describing how the system is designed and built to meet business requirements.

## Overview

The architecture documentation focuses on the **HOW** - technical decisions, system structure, and implementation patterns that realize the business domain described in `/docs/domain/`.

## Documentation Structure

- **[Architecture Reference](../reference/architecture.md)** - Complete system architecture and technical design
- **[Context Map](./context-map.md)** - Visual representation of bounded context relationships and integration patterns
- **[adr/](./adr/README.md)** - Architecture Decision Records documenting significant technical decisions

## Architectural Principles

### Core Philosophy

- **Local-First Architecture**: All core functionality works offline with local data storage
- **Domain-Driven Design**: Clear bounded contexts with well-defined boundaries
- **AI-Native Design**: Built specifically for human-AI collaboration workflows
- **Secure-by-Design**: Security integrated into every architectural decision
- **Standards-First Approach**: Adopt industry standards over custom implementations
- **CLI-First Interface**: Command-line interface as foundation for all other interfaces

### Quality Attributes

- **Modularity**: Bounded contexts can evolve independently
- **Scalability**: Support for multiple projects and AI assistants
- **Extensibility**: Plugin architecture for new integrations
- **Reliability**: Robust error handling and data consistency

## Key Architectural Views

### System Architecture

See [Architecture Reference](../reference/architecture.md) for detailed views including:

- High-level component architecture
- Technology stack decisions
- Data storage patterns
- Integration architecture

### Context Relationships

See [Context Map](./context-map.md) for:

- Bounded context boundaries
- Integration patterns between contexts
- Shared kernel definitions
- Anti-corruption layer implementations

### Design Decisions

See [Architecture Decision Records](./adr/) for:

- Rationale behind major technical choices
- Trade-offs considered
- Implementation guidance
- Evolution strategies

## Technology Stack Summary

### Core Technologies

- **Runtime**: Node.js with ES modules
- **Language**: TypeScript for type safety
- **Package Manager**: pnpm for monorepo management (following npm ecosystem standards)
- **CLI Framework**: Commander.js (following POSIX and GNU conventions)

### Storage

- **Local Storage**: JSON files for structured data (XDG Base Directory compliance)
- **Documentation**: CommonMark format for Markdown files
- **Templates**: File-based template system
- **Configuration**: XDG Base Directory specification

### Integration

- **AI Integration**: Model Context Protocol (MCP) - launched via CLI
- **External Systems**: RESTful APIs following OpenAPI 3.0 specification
- **Authentication**: OAuth 2.0 for external services (industry standard)
- **Versioning**: Semantic Versioning (SemVer 2.0.0) for all components

## Architectural Patterns

### Domain Patterns

- **Bounded Contexts**: Clear separation of domain concerns
- **Aggregates**: Consistency boundaries within contexts
- **Domain Events**: Cross-context communication
- **Repository Pattern**: Data access abstraction

### Integration Patterns

- **Anti-Corruption Layer**: Protection from external system changes
- **Context Mapping**: Well-defined relationships between contexts
- **Event-Driven**: Asynchronous communication between contexts
- **API Gateway**: Unified external interface

### Implementation Patterns

- **CLI-First Pattern**: All interfaces built on CLI foundation
- **Dependency Injection**: Loose coupling and testability
- **Command Pattern**: CLI command implementation
- **Strategy Pattern**: Pluggable integrations
- **Observer Pattern**: Event handling
- **Standards Adoption**: Prefer industry standards over custom solutions

## Interface Architecture

### Primary Interface

- **CLI**: Complete functionality with structured output formats
- **Interactive and non-interactive modes**
- **Foundation for all other interfaces**

### Additional Interfaces

- **MCP Server**: AI integration (launched via CLI)
- **SDK/Libraries**: Direct core access for programmatic use
- **TUI**: Enhanced terminal experience (launched via CLI)
- **RESTful API**: External integration (TBD)
- **Web UI**: Visual interface (TBD)
- **IDE Extensions**: Integrated development experience (TBD)

### Design Principles

- **CLI as Single Source of Truth**: All business logic in CLI layer
- **Unified Command Model**: Consistent operations across interfaces
- **Progressive Enhancement**: Basic functionality works everywhere
- **Configuration-Driven**: External integrations managed via configuration
- **Context-Aware**: Support for both global and project-specific contexts

## Related Documentation

- [Domain Overview](./domain-overview.md) - Business concepts and requirements
- **TODO: Bounded Contexts Documentation** - Detailed context implementations including:
  - Ticket Management Context (domain model, workflows, constraints)
  - AI Integration Context (AI assistant coordination, validation workflows)
  - External Sync Context (integration patterns, conflict resolution)
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Development guidelines
- [Testing Strategy](../guides/testing-strategy.md) - Testing approach
