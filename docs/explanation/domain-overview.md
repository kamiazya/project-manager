# Domain Overview

## Project Vision

Enable effective collaboration between developers and AI assistants through a local ticket management system that maintains shared context and promotes shift-left development practices.

## Core Purpose

- **AI Collaboration**: Prevent context loss and maintain focus on primary objectives when working with AI assistants
- **Shared Understanding**: Create a single source of truth for human developers and multiple AI systems
- **Shift-Left Development**: Move quality assurance and design decisions earlier through issue-based workflows
- **Pre-Implementation Review**: Document and validate approaches before coding begins

## User Personas

### AI-Driven Developer

- Uses AI assistants daily for development
- Struggles with context loss during long sessions
- Wants to maintain project momentum

### Tech Lead

- Reviews implementation plans from team
- Coordinates between multiple developers and AI assistants
- Needs visibility into project progress

### OSS Contributor

- Works on multiple projects simultaneously
- Collaborates with international teams
- Needs to sync local work with upstream projects

### AI Agent/Assistant (Claude/Gemini)

- Processes developer requests
- Needs context from previous sessions
- Must understand project state and priorities

## Key Domain Concepts

The Project Manager domain revolves around these core concepts:

### Primary Entities

- **Project**: A software development initiative with tickets, epics, and contributors
- **Ticket/Issue**: A discrete unit of work with status, priority, and assignees
  - **Ticket Alias**: Human-friendly identifiers for tickets (canonical system-generated and custom user-defined)
- **Epic**: A collection of related tickets forming a larger initiative
- **User**: Human participants (developers, project managers, stakeholders)
- **AI Assistant**: AI systems that participate in development workflows

### Key Workflows

- **Issue Management**: Creating, updating, and tracking development tasks
  - **Alias Resolution**: Flexible ticket lookup using IDs or aliases with partial matching
- **AI Collaboration**: Human-AI coordination for development tasks
- **External Synchronization**: Bidirectional sync with external project management tools
- **Implementation Planning**: Pre-development design and validation workflows

### Bounded Contexts

The domain is organized into three main bounded contexts:

1. **Ticket Management** - Core issue tracking and project management
2. **AI Integration** - AI assistant collaboration and coordination
3. **External Sync** - Integration with external project management systems

## Business Requirements Summary

### Issue-Based Development

- Comprehensive tickets with background, purpose, and acceptance criteria
- Implementation plans with technical approaches for review
- Design proposals capturing architectural decisions
- Progress tracking throughout issue lifecycle
- > 80% first-pass completion rate for asynchronously delegated tasks
- Human-friendly ticket aliases for improved collaboration and memorability

### Local-First Project Management

- Full project management capabilities that work offline
- Optional synchronization with external systems
- Data sovereignty and privacy controls
- Version control integration

### AI-Assisted Development

- Natural language interfaces for non-English speakers
- Context preservation across AI sessions
- AI-assisted validation workflows
- Multi-AI coordination capabilities

### External System Integration

- Bidirectional sync with GitHub Issues, Jira, Linear
- Privacy-aware data sharing
- Conflict resolution mechanisms
- Extensible plugin architecture

## Target Users

- **AI-Driven Developers**: Those using AI assistants as primary development partners
- **International Engineers**: Engineers working in foreign companies who want to focus on engineering without language barriers
- **OSS Contributors**: Non-English native speakers contributing to international open source projects
- **Distributed Teams**: Teams needing to coordinate between multiple AI systems and human developers

## Relationship to Technical Implementation

Domain concepts are implemented through the technical architecture described in the reference documentation. The domain model drives:

- Data structures and entity relationships
- API design and CLI commands
- Integration patterns with external systems
- Security and privacy implementations
- Validation rules and business logic

> **Note**: For technical specifications and implementation details, see the reference documentation. For terminology definitions, see the [ubiquitous language](../reference/ubiquitous-language.md).

## Related Domain Documentation

- [User Stories and Use Cases](./user-stories.md) - Detailed user personas, workflows, and use cases
- [Requirements](./requirements.md) - Complete functional and non-functional requirements
- [Context Map](./context-map.md) - Bounded context relationships and integration patterns
