# Ubiquitous Language

This document defines the core domain terminology used throughout the Project Manager system. All documentation, code, and communication should use these terms consistently to ensure shared understanding across the community.

## Core Entities

### Project

A software development initiative that contains tickets, epics, and involves multiple contributors (human and AI). Projects have configuration, metadata, and track overall progress.

**Synonyms**: Repository, Workspace
**Context**: Primary aggregate root in Ticket Management context

### Ticket

A discrete unit of development work with defined scope, status, and acceptance criteria. Tickets are the fundamental unit of work organization.

**Aliases**: Issue (when referring to external systems like GitHub Issues)
**Context**: Core entity in Ticket Management context
**Note**: We use "Ticket" internally, "Issue" when interfacing with external systems

### Epic

A collection of related tickets that together deliver a significant business capability or user-facing feature. Epics provide grouping and progress tracking across multiple tickets.

**Context**: Aggregate in Ticket Management context
**Relationship**: Contains multiple Tickets

### User

A human participant in the development process. Users can be developers, project managers, stakeholders, or contributors.

**Context**: Shared across all bounded contexts
**Roles**: Developer, Project Manager, Stakeholder, Contributor

### AI Assistant

An artificial intelligence system that participates in development workflows, providing suggestions, generating code, or automating tasks.

**Context**: Core entity in AI Integration context
**Types**: Code Generator, Code Reviewer, Task Planner, Translator

## Value Objects

### Status

The current state of a ticket in its lifecycle.

**Valid Values**: `pending`, `in_progress`, `completed`, `archived`
**Context**: Ticket Management

### Priority

The relative importance and urgency of a ticket.

**Valid Values**: `high`, `medium`, `low`
**Context**: Ticket Management

### Ticket Type

The category of work represented by a ticket.

**Valid Values**: `feature`, `bug`, `task`, `research`, `design`, `chore`
**Context**: Ticket Management

### Privacy Level

The visibility and sharing policy for project artifacts.

**Valid Values**: `local-only`, `shareable`, `public`
**Context**: External Sync

## Domain Services

### Implementation Planner

Coordinates the pre-implementation design and validation workflow, including AI expert consultation and design proposal creation.

**Context**: AI Integration
**Responsibilities**: Design validation, AI expert coordination, plan generation

### Sync Coordinator

Manages bidirectional synchronization between local tickets and external project management systems.

**Context**: External Sync
**Responsibilities**: Conflict resolution, data mapping, sync scheduling

### Context Manager

Maintains shared context and knowledge across human developers and multiple AI assistants.

**Context**: AI Integration
**Responsibilities**: Context preservation, knowledge sharing, session coordination

## Architecture and Interface Terms

### CLI-First Architecture

Design principle where the Command-Line Interface serves as the primary interface and foundation for all other interfaces.

**Related Terms**: Primary Interface, Interface Foundation
**Context**: All contexts (cross-cutting principle)
**Implementation**: Other interfaces (TUI, MCP) are launched via CLI

### MCP Server (Model Context Protocol)

AI integration interface that provides standardized communication between AI assistants and the Project Manager system.

**Context**: AI Integration
**Launch Method**: Via CLI command
**Purpose**: AI assistant coordination, context sharing

### TUI (Terminal User Interface)

Enhanced interactive command-line interface providing rich text-based user interaction.

**Context**: Ticket Management
**Launch Method**: Via CLI command
**Purpose**: Interactive ticket management, visual feedback

### SDK (Software Development Kit)

Programmatic interface providing direct access to core business logic for integration purposes.

**Context**: All contexts
**Access Pattern**: Direct core access
**Purpose**: Library integration, automation

### Standards-First Approach

Design principle prioritizing adoption of industry standards over custom implementations.

**Examples**: XDG Base Directory, OAuth 2.0, OpenAPI, CommonMark
**Context**: All contexts (cross-cutting principle)

### Diagrams-First Documentation

Documentation approach using Mermaid diagrams to enhance understanding and reduce ambiguity.

**Tool**: Mermaid
**Context**: All documentation
**Purpose**: Visual communication, AI collaboration

## Context-Specific Terms

### Bounded Context

Domain-driven design concept representing a distinct area of the system with its own models and vocabulary.

**Current Contexts**: Ticket Management, AI Integration, External Sync
**Relationships**: Customer/Supplier, Conformist, Separate Ways
**Integration**: Through shared kernel and CLI-first architecture

### Shared Kernel

Common concepts and values shared across all bounded contexts.

**Components**: User Identity, Project ID, Ticket ID, Status Values, Priority Values
**Purpose**: Consistency across contexts, integration foundation

### Anti-Corruption Layer

Protection pattern preventing external system changes from affecting internal domain models.

**Context**: External Sync
**Purpose**: Data mapping, external system abstraction

## Data and Storage Terms

### Cross-Platform Directory Standards

Platform-specific directory conventions for configuration and data storage.

**Purpose**: Standards compliance, predictable file locations across all platforms
**Windows**: %APPDATA%, %LOCALAPPDATA%
**macOS**: ~/Library/Application Support, ~/Library/Logs
**Linux**: ~/.config, ~/.cache, ~/.local/share (XDG spec)
**Context**: All contexts (technical implementation)

### Context-Aware Storage

Storage approach supporting both global and project-specific configurations.

**Global Context**: Platform-specific user directory (cross-platform compliant)
**Project Context**: Project directory (.pm/)
**Detection**: Presence of .pm/config.json

### Event Sourcing

Data pattern using append-only event log for audit trail and change tracking.

**File Format**: .jsonl (newline-delimited JSON)
**Purpose**: Audit trail, change history, recovery
**Context**: All contexts (technical implementation)

### Co-authorship Tracking

Method for recording both human and AI contributions to development work.

**Format**: Git-style co-authorship
**Purpose**: Attribution, audit trail, collaboration history
**Context**: AI Integration

## Operational Terms

### Operation Risk Assessment

Categorization system for determining appropriate safeguards for different types of operations.

**Risk Levels**: High, Medium, Low
**High Risk**: File deletion, bulk operations, destructive changes
**Purpose**: User safety, operation control

### Safeguards

User confirmation steps required before AI executes potentially destructive operations.

**Trigger**: High-risk operations
**Types**: User confirmation, approval workflows
**Context**: AI Integration

### Design Proposal

Structured document capturing technical approach, alternatives, and rationale before implementation.

**Components**: Approach, rationale, alternatives, validation status
**Process**: Creation → AI Review → Community Review → Implementation
**Context**: AI Integration

### AI Session

Bounded interaction period between human developers and AI assistants with maintained context.

**Properties**: Session ID, context data, expiration
**Purpose**: Context preservation, resource management
**Context**: AI Integration

## Workflows and Processes

### Issue-Based Development

The core workflow where all development work is organized around tickets with clear acceptance criteria, implementation plans, and progress tracking.

**Phases**: Design Proposal → AI Validation → Implementation → Review

### AI-Assisted Validation

The process of using multiple AI experts to review and validate design proposals before implementation begins.

**Participants**: Human developer, multiple AI experts, system coordinator

### Local-First Workflow

The principle that all core functionality works offline with local data storage, with optional external synchronization.

**Benefits**: Offline capability, data ownership, reduced dependencies

## Relationships and Rules

### Aggregation Rules

- **Project** contains multiple **Epics** and **Tickets**
- **Epic** contains multiple **Tickets**
- **Ticket** belongs to one **Project** and optionally one **Epic**

### Status Transition Rules

- Tickets can only move forward in status: `pending` → `in_progress` → `completed` → `archived`
- Only one ticket per AI Assistant can be `in_progress` at a time
- Tickets with dependencies cannot start until prerequisites are `completed`

### Dependency Rules

- **Tickets** can depend on other **Tickets** (prerequisite relationship)
- **Tickets** can block other **Tickets** (blocking relationship)
- **Epics** cannot start until all prerequisite **Tickets** are completed

## Integration Terminology

### External System Mapping

When interfacing with external systems, these mappings apply:

| Internal Term | GitHub Issues | Jira | Linear |
|--------------|---------------|------|--------|
| Ticket | Issue | Issue | Issue |
| Epic | Milestone | Epic | Project |
| Project | Repository | Project | Team |
| Status | State | Status | State |

### AI System Terminology

- **AI Expert**: Specialized AI assistant for specific domains (architecture, testing, etc.)
- **AI Context**: The shared knowledge and state provided to AI assistants
- **AI Session**: A bounded interaction period between human and AI assistant
- **AI Validation**: The process of AI expert review for design proposals

### Architecture Decision Record (ADR) Terminology

#### Core ADR Concepts

**Architecture Decision Record (ADR)**
A document that captures an important architectural decision along with its context, rationale, and consequences. ADRs preserve the reasoning behind architectural choices for future reference.

**Context**: Documentation and Decision Tracking
**Purpose**: Decision preservation, knowledge sharing, architectural governance
**Format**: Standardized template with Status, Context, Decision, Consequences, etc.

**Decision Status**
The current state of an architectural decision record.

**Valid Values**: `Accepted`, `Superseded by ADR-XXXX`
**Note**: `Proposed` and `Deprecated` statuses are not used in this project
**Principle**: ADRs document decisions already made, not proposals under consideration

#### ADR Lifecycle and Processes

**Pre-ADR Phase**
The discussion and consensus-building process that occurs before creating an ADR.

**Location**: GitHub Issues, Pull Requests, Community Discussions
**Activities**: Discussion → Proposal → Community Review → Consensus
**Outcome**: Architectural decision ready for documentation

**ADR Management Phase**
The Git-managed phase where decisions are documented and tracked.

**Location**: Git Repository (docs/explanation/adr/)
**Activities**: Document Creation → Status Management → Evolution Tracking
**Principle**: All ADRs start with "Accepted" status

**Community Review**
The process of evaluating architectural proposals through open source collaboration.

**Participants**: Community members, maintainers, domain experts
**Channels**: GitHub Issues, Pull Requests, Architecture discussions
**Note**: Uses "Community" rather than "Team" to reflect OSS nature

#### ADR Status and Transitions

**Accepted**
The decision has been agreed upon and should be implemented. This is the initial and primary status for all ADRs.

**Context**: All new ADRs
**Meaning**: Decision is valid and should guide implementation
**Transition**: Can move to "Superseded" when replaced

**Superseded by ADR-XXXX**
The decision has been replaced by a newer ADR. Includes reference to the replacement.

**Context**: Decision evolution
**Meaning**: Decision is no longer current but preserved for historical context
**Format**: Must include reference to the superseding ADR

#### Decision vs Implementation Separation

**Decision Record**
The architectural choice and its rationale, independent of implementation status.

**Tracked in**: ADR documents
**Lifecycle**: Accepted → Superseded
**Principle**: Records "what" and "why" decisions were made

**Implementation Status**
The current state of implementing an architectural decision.

**Tracked in**: Project management tools, GitHub Issues, development workflows
**Lifecycle**: Planned → In Progress → Completed → Migrated → Retired
**Principle**: Separate from decision validity

#### ADR Integration Patterns

**ADR-First Development**
Approach where significant architectural decisions are documented before implementation.

**Process**: Identify Need → Community Discussion → ADR Creation → Implementation
**Benefits**: Preserved rationale, improved onboarding, better decision quality

**Decision Traceability**
The ability to track the evolution and relationships of architectural decisions.

**Methods**: ADR numbering, cross-references, dependency graphs
**Tools**: Mermaid diagrams, ADR index tables
**Purpose**: Understanding decision history and impacts

#### Template and Standards

**ADR Template**
Standardized format ensuring consistent structure across all decision records.

**Sections**: Status, Context, Decision, Consequences, Alternatives, Implementation Notes
**Location**: docs/explanation/adr/TEMPLATE.md
**Purpose**: Consistency, completeness, ease of use

**ADR Numbering**
Sequential numbering system for ADR identification and ordering.

**Format**: NNNN-short-decision-title.md (e.g., 0001-record-architecture-decisions.md)
**Purpose**: Unique identification, chronological ordering, easy reference

## Anti-Patterns to Avoid

### Terminology Confusion

- ❌ Don't use "Issue" and "Ticket" interchangeably in internal documentation
- ❌ Don't use "Task" to refer to Tickets (Task is a specific Ticket Type)
- ❌ Don't use "Story" to refer to Tickets (Stories are in USER_STORIES.md)
- ❌ Don't use "Proposed" status for ADRs (use Pre-ADR Phase instead)
- ❌ Don't use "Deprecated" status for ADRs (use "Superseded" instead)
- ❌ Don't use "Team" when referring to OSS community (use "Community" instead)

### Context Mixing

- ❌ Don't mix AI Integration concepts in Ticket Management documentation
- ❌ Don't put External Sync requirements in AI Integration context
- ❌ Don't reference implementation details in domain documentation
- ❌ Don't track implementation status in ADR status (use separate systems)
- ❌ Don't mix decision rationale with implementation concerns in ADRs

## Evolution and Maintenance

This ubiquitous language should evolve as the domain understanding deepens. Changes should be:

1. **Discussed** with the core community before implementation
2. **Documented** with rationale for the change
3. **Propagated** across all documentation and code
4. **Validated** through usage in real scenarios

All community members are responsible for maintaining consistency with this language in their communication and contributions.
