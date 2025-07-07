# Context Map

This document visualizes the relationships between bounded contexts in the Project Manager system, following Domain-Driven Design principles. The context map helps teams understand dependencies, data flow, and integration patterns between different parts of the system.

## Overview

The Project Manager system is organized into three primary bounded contexts, each with distinct responsibilities and models:

```
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│   Ticket Management │      │   AI Integration    │      │   External Sync     │
│                     │      │                     │      │                     │
│ • Project           │◄────►│ • AI Assistant      │      │ • External Project  │
│ • Ticket            │      │ • AI Context        │◄────►│ • Sync Mapping      │
│ • Epic              │      │ • Design Proposal   │      │ • External Ticket   │
│ • User              │      │ • Validation Result │      │ • Sync Status       │
│ • Implementation    │      │                     │      │                     │
│   Plan              │      │                     │      │                     │
└─────────────────────┘      └─────────────────────┘      └─────────────────────┘
        │                            │                            │
        │                            │                            │
        └────────────── Shared Kernel ──────────────────────────┘
                     │ • User Identity • Project ID • Ticket ID │
                     │ • Status Values • Priority Values        │
```

## Bounded Context Details

### 1. Ticket Management Context

**Responsibility**: Core project and ticket lifecycle management

**Core Concepts**:
- **Project**: Aggregate root containing tickets and configuration
- **Ticket**: Work item with status, priority, and dependencies
- **Epic**: Grouping of related tickets
- **User**: Human participants in the project
- **Implementation Plan**: Technical approach and design decisions

**Key Workflows**:
- Ticket creation and lifecycle management
- Epic planning and progress tracking
- Dependency management and resolution
- Implementation planning and documentation

**Autonomy Level**: High - Can function independently with local storage

### 2. AI Integration Context

**Responsibility**: AI assistant coordination and collaboration workflows

**Core Concepts**:
- **AI Assistant**: Autonomous AI participant in development
- **AI Context**: Shared knowledge and state for AI systems
- **Design Proposal**: Technical design requiring validation
- **Validation Result**: Outcome of AI expert review process
- **AI Session**: Bounded interaction between human and AI

**Key Workflows**:
- AI assistant task assignment and coordination
- Design proposal creation and validation
- Multi-AI collaboration and context sharing
- Translation and language bridging

**Autonomy Level**: Medium - Requires coordination with Ticket Management

### 3. External Sync Context

**Responsibility**: Integration with external project management systems

**Core Concepts**:
- **External Project**: Representation of project in external system
- **Sync Mapping**: Bidirectional mapping between internal and external entities
- **External Ticket**: External system's representation of our tickets
- **Sync Status**: State and health of synchronization processes

**Key Workflows**:
- Bidirectional synchronization with GitHub Issues, Jira, etc.
- Conflict resolution and data mapping
- Privacy-aware selective sharing
- External system authentication and authorization

**Autonomy Level**: Low - Dependent on external systems and internal contexts

## Context Relationships

### Ticket Management ↔ AI Integration

**Relationship Type**: Customer/Supplier

**Integration Pattern**: 
- **Ticket Management** is the **Customer** (upstream)
- **AI Integration** is the **Supplier** (downstream)

**Data Flow**:
- Ticket Management provides tickets and implementation plans to AI Integration
- AI Integration returns validation results and AI-generated proposals
- AI Integration updates ticket status based on AI work completion

**Anti-Corruption Layer**: 
- AI Integration translates ticket concepts into AI-specific context
- Validation results are translated back to ticket management concepts

**Key Integration Points**:
```
Ticket Management → AI Integration:
- Ticket assignment to AI Assistant
- Implementation plan validation requests
- Context sharing for AI decision making

AI Integration → Ticket Management:
- Validation results and feedback
- AI-generated design proposals
- Ticket status updates from AI work
```

### Ticket Management ↔ External Sync

**Relationship Type**: Conformist

**Integration Pattern**: 
- **External Sync** conforms to **Ticket Management** model
- External systems are adapted to internal model via mapping

**Data Flow**:
- Ticket Management provides tickets for external synchronization
- External Sync translates between internal and external representations
- External changes are pulled and mapped to internal model

**Anti-Corruption Layer**:
- External Sync protects Ticket Management from external system changes
- Data mapping layer handles format and terminology differences

**Key Integration Points**:
```
Ticket Management → External Sync:
- Tickets marked for external sharing
- Project configuration and sync preferences
- Privacy and access control settings

External Sync → Ticket Management:
- External changes and updates
- Conflict resolution proposals
- Sync status and health reports
```

### AI Integration ↔ External Sync

**Relationship Type**: Separate Ways

**Integration Pattern**: 
- Minimal direct integration
- Coordination happens through Ticket Management context

**Rationale**:
- AI Integration focuses on internal development workflows
- External Sync focuses on external system coordination
- Direct integration would create unnecessary coupling

**Indirect Coordination**:
- AI-generated content can be shared externally via Ticket Management
- External feedback can influence AI validation through ticket updates

## Shared Kernel

**Shared Concepts** (used across all contexts):

### Identity Values
- **User Identity**: Unique identifier for human participants
- **Project ID**: Unique identifier for projects across all contexts
- **Ticket ID**: Unique identifier for tickets across all contexts

### Enumeration Values
- **Status Values**: `pending`, `in_progress`, `completed`, `archived`
- **Priority Values**: `high`, `medium`, `low`
- **Privacy Levels**: `local-only`, `shareable`, `public`

### Event Types
- **Ticket Events**: Created, Updated, Completed, Archived
- **User Events**: Added, Removed, Role Changed
- **Project Events**: Created, Configured, Archived

## Evolution Strategy

### Context Independence
Each bounded context should be able to evolve its internal model independently, with well-defined interfaces managing cross-context communication.

### Interface Stability
Changes to shared kernel require coordination across all contexts. Interface changes should be versioned and backward-compatible when possible.

### Future Context Addition
New bounded contexts (e.g., Reporting, Analytics) can be added without modifying existing contexts by following the established integration patterns.

## Implementation Guidance

### Team Organization
- **Ticket Management**: Core platform team
- **AI Integration**: AI/ML specialists
- **External Sync**: Integration specialists

### Technology Boundaries
- Each context can choose appropriate technology stacks
- Integration happens through well-defined APIs and events
- Shared kernel implemented as shared libraries/modules

### Testing Strategy
- Unit tests within each context
- Integration tests at context boundaries
- Contract tests for external integrations

## Related Documentation

- [Architecture Overview](./README.md) - High-level architectural principles
- [Domain Documentation](../domain/README.md) - Business domain concepts
- [Context Implementation Details](../contexts/README.md) - Detailed context specifications
- [Ubiquitous Language](../domain/UBIQUITOUS_LANGUAGE.md) - Domain terminology