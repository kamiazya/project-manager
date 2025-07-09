# Domain Documentation

This directory contains domain-focused documentation that describes **what** the Project Manager system does from a business perspective, independent of technical implementation details.

## Purpose

The domain documentation captures the core business concepts, rules, and workflows that drive the Project Manager system. This follows Domain-Driven Design (DDD) principles to ensure a shared understanding between business stakeholders and technical teams.

## Documents Overview

- **[USER_STORIES.md](./USER_STORIES.md)** - User personas and high-level user scenarios
- **[UBIQUITOUS_LANGUAGE.md](./UBIQUITOUS_LANGUAGE.md)** - Centralized glossary of domain terms and concepts

## Relationship to Other Documentation

- **Domain ↔ Architecture**: Domain concepts are implemented through the technical architecture described in `/docs/architecture/`
- **Domain ↔ Contexts**: Domain concepts will be detailed and organized within specific bounded contexts (TODO: implement context documentation)
- **Domain ↔ Requirements**: High-level domain understanding drives the specific requirements within each bounded context

## Key Domain Concepts

The Project Manager domain revolves around these core concepts:

### Primary Entities

- **Project**: A software development initiative with tickets, epics, and contributors
- **Ticket/Issue**: A discrete unit of work with status, priority, and assignees
- **Epic**: A collection of related tickets forming a larger initiative
- **User**: Human participants (developers, project managers, stakeholders)
- **AI Assistant**: AI systems that participate in development workflows

### Key Workflows

- **Issue Management**: Creating, updating, and tracking development tasks
- **AI Collaboration**: Human-AI coordination for development tasks
- **External Synchronization**: Bidirectional sync with external project management tools
- **Implementation Planning**: Pre-development design and validation workflows

### Bounded Contexts

The domain is organized into three main bounded contexts:

1. **Ticket Management** - Core issue tracking and project management
2. **AI Integration** - AI assistant collaboration and coordination
3. **External Sync** - Integration with external project management systems

<!-- TODO: Implement detailed bounded context documentation -->
