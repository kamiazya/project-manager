# Architecture Documentation

This directory contains technical architecture documentation for the Project Manager system, describing how the system is designed and built to meet business requirements.

## Overview

The architecture documentation focuses on the **HOW** - technical decisions, system structure, and implementation patterns that realize the business domain described in `/docs/domain/`.

## Documentation Structure

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Comprehensive system architecture including principles, components, and technical stack
- **[CONTEXT_MAP.md](./CONTEXT_MAP.md)** - Visual representation of bounded context relationships and integration patterns
- **[adr/](./adr/)** - Architecture Decision Records documenting significant technical decisions

## Architectural Principles

### Core Philosophy
- **Local-First Architecture**: All core functionality works offline with local data storage
- **Domain-Driven Design**: Clear bounded contexts with well-defined boundaries
- **AI-Native Design**: Built specifically for human-AI collaboration workflows
- **Secure-by-Design**: Security integrated into every architectural decision

### Quality Attributes
- **Modularity**: Bounded contexts can evolve independently
- **Scalability**: Support for multiple projects and AI assistants
- **Extensibility**: Plugin architecture for new integrations
- **Reliability**: Robust error handling and data consistency

## Key Architectural Views

### System Architecture
See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed views including:
- High-level component architecture
- Technology stack decisions
- Data storage patterns
- Integration architecture

### Context Relationships
See [CONTEXT_MAP.md](./CONTEXT_MAP.md) for:
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
- **Package Manager**: pnpm for monorepo management
- **CLI Framework**: Commander.js

### Storage
- **Local Storage**: JSON files for structured data
- **Documentation**: Markdown files
- **Templates**: File-based template system

### Integration
- **AI Integration**: Model Context Protocol (MCP)
- **External Systems**: REST APIs and webhooks
- **Authentication**: OAuth 2.0 for external services

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
- **Dependency Injection**: Loose coupling and testability
- **Command Pattern**: CLI command implementation
- **Strategy Pattern**: Pluggable integrations
- **Observer Pattern**: Event handling

## Related Documentation

- [Domain Documentation](../domain/) - Business concepts and requirements
- [Bounded Contexts](../contexts/) - Detailed context implementations
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Development guidelines
- [TEST_STRATEGY.md](../TEST_STRATEGY.md) - Testing approach