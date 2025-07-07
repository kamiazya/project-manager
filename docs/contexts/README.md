# Bounded Contexts

This directory contains detailed documentation for each bounded context in the Project Manager system. Each bounded context represents a distinct area of the domain with its own models, workflows, and responsibilities.

## What is a Bounded Context?

A bounded context is a central pattern in Domain-Driven Design (DDD). It defines the boundaries within which a particular domain model is defined and applicable. Each bounded context has:

- **Clear boundaries** that separate it from other contexts
- **Consistent domain model** with well-defined entities and relationships
- **Unified language** that all team members understand
- **Autonomous development** capability with minimal external dependencies

## Project Manager Bounded Contexts

### 1. [Ticket Management](./ticket_management/)
**Core Responsibility**: Project and ticket lifecycle management

The foundation of the system, handling the creation, organization, and tracking of development work through tickets and epics.

**Key Entities**: Project, Ticket, Epic, User, Implementation Plan  
**Primary Workflows**: Ticket lifecycle, Epic planning, Dependency management  
**Team Focus**: Core platform development

### 2. [AI Integration](./ai_integration/)
**Core Responsibility**: AI assistant coordination and collaboration

Manages the interaction between human developers and AI assistants, including task assignment, design validation, and multi-AI coordination.

**Key Entities**: AI Assistant, AI Context, Design Proposal, Validation Result  
**Primary Workflows**: AI task assignment, Design validation, Context sharing  
**Team Focus**: AI/ML specialists

### 3. [External Sync](./external_sync/)
**Core Responsibility**: Integration with external project management systems

Handles bidirectional synchronization with external systems like GitHub Issues, Jira, and other project management tools.

**Key Entities**: External Project, Sync Mapping, External Ticket, Sync Status  
**Primary Workflows**: Data synchronization, Conflict resolution, Privacy management  
**Team Focus**: Integration specialists

## Context Relationships

For a visual overview of how these contexts interact, see the [Context Map](../architecture/CONTEXT_MAP.md).

### Integration Patterns

- **Customer/Supplier**: Ticket Management (Customer) ↔ AI Integration (Supplier)
- **Conformist**: Ticket Management ↔ External Sync (External Sync conforms)
- **Separate Ways**: AI Integration ↔ External Sync (minimal direct integration)

### Shared Kernel

All contexts share common concepts defined in the [Ubiquitous Language](../domain/UBIQUITOUS_LANGUAGE.md):
- Identity values (User ID, Project ID, Ticket ID)
- Status and priority enumerations
- Core event types

## Context Documentation Structure

Each bounded context directory contains:

- **README.md** - Context overview, scope, and responsibilities
- **DOMAIN_MODEL.md** - Entities, aggregates, value objects, and domain services
- **WORKFLOWS.md** - Key business processes and use cases
- **CONSTRAINTS.md** - Context-specific non-functional requirements and constraints

## Development Guidelines

### Team Autonomy
Each bounded context should be developed by a focused team that can make autonomous decisions about:
- Internal domain model evolution
- Technology choices (within architectural guidelines)
- Implementation patterns and practices
- Testing strategies

### Context Independence
Changes within a bounded context should not require changes in other contexts, except through well-defined interfaces.

### Cross-Context Communication
When contexts need to communicate:
1. Use well-defined events and APIs
2. Implement anti-corruption layers when necessary
3. Maintain interface stability and versioning
4. Document integration patterns clearly

## Evolution Strategy

### Adding New Contexts
As the system grows, new bounded contexts can be added by:
1. Identifying distinct domain areas with clear boundaries
2. Creating new context directory with standard documentation
3. Defining integration patterns with existing contexts
4. Updating the context map to reflect new relationships

### Context Refactoring
Existing contexts may need to be split or merged based on:
- Team structure changes
- Domain understanding evolution
- Performance or scaling requirements
- Technology or architectural changes

## Related Documentation

- [Context Map](../architecture/CONTEXT_MAP.md) - Visual representation of context relationships
- [Domain Overview](../domain/README.md) - High-level domain concepts
- [Ubiquitous Language](../domain/UBIQUITOUS_LANGUAGE.md) - Shared terminology
- [Architecture Overview](../architecture/README.md) - System architecture principles