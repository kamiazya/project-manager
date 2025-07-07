# Ubiquitous Language

This document defines the core domain terminology used throughout the Project Manager system. All documentation, code, and communication should use these terms consistently to ensure shared understanding across the team.

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

**Valid Values**: `feature`, `bug`, `task`, `epic`, `research`, `design`, `chore`  
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

## Anti-Patterns to Avoid

### Terminology Confusion
- ❌ Don't use "Issue" and "Ticket" interchangeably in internal documentation
- ❌ Don't use "Task" to refer to Tickets (Task is a specific Ticket Type)
- ❌ Don't use "Story" to refer to Tickets (Stories are in USER_STORIES.md)

### Context Mixing
- ❌ Don't mix AI Integration concepts in Ticket Management documentation
- ❌ Don't put External Sync requirements in AI Integration context
- ❌ Don't reference implementation details in domain documentation

## Evolution and Maintenance

This ubiquitous language should evolve as the domain understanding deepens. Changes should be:

1. **Discussed** with the core team before implementation
2. **Documented** with rationale for the change
3. **Propagated** across all documentation and code
4. **Validated** through usage in real scenarios

All team members are responsible for maintaining consistency with this language in their communication and contributions.