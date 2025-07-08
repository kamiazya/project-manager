# ARCHITECTURE

## 1. Introduction

This document defines the architectural principles, system structure, and technical decisions for the Project Manager system. It serves as the technical blueprint that guides implementation decisions and provides a comprehensive view of the system's architecture.

## 2. System Overview

Project Manager is a local-first ticket management system designed to enable effective collaboration between developers and AI assistants through issue-based development workflows.

### 2.1. Core Components

- **CLI Interface**: Command-line tools for developer productivity
- **Local Storage**: File-based persistence for tickets, epics, and project data
- **MCP Server**: Model Context Protocol implementation for AI integration
- **External Integrations**: External tool-based synchronization with existing systems

## 3. Architectural Principles

### 3.1. Design Philosophy

- **Local-First Architecture**: All core functionality works offline with local data storage
- **AI-Driven Development**: Built specifically to support AI-assisted development workflows
- **Issue-Based Development**: Structured around tickets, epics, and implementation planning
- **Secure-by-Design**: Security considerations integrated into every architectural decision

### 3.2. Quality Principles

- **Shift-Left Development**: Early quality assurance through pre-implementation reviews
- **Document-Driven Development**: Specifications and design decisions captured before implementation
- **Test-Driven Development**: Comprehensive testing strategy from unit to integration levels
- **Domain-Driven Design**: Clear domain model with ubiquitous language

## 4. System Architecture

### 4.1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    External Systems                          │
├─────────────────────────────────────────────────────────────┤
│  GitHub Issues  │  Jira  │  Other PM Tools  │  AI Services  │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────────┐
│                  Integration Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Sync Services  │  MCP Server  │  Export/Import  │  API     │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────────┐
│                    Core Domain                              │
├─────────────────────────────────────────────────────────────┤
│  Ticket Mgmt  │  Epic Mgmt  │  Project Mgmt  │  Workflow   │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────────┐
│                 Infrastructure Layer                        │
├─────────────────────────────────────────────────────────────┤
│  File Storage  │  CLI Engine  │  Logging  │  Configuration  │
└─────────────────────────────────────────────────────────────┘
```

### 4.2. Domain Model

#### Core Entities

**Project**
- Contains configuration and metadata
- Manages tickets, epics, and roadmaps
- Tracks contributors (human and AI)

**Ticket (Issue)**
- Represents a single development task
- Contains background, purpose, and acceptance criteria
- Tracks status, priority, and assignments
- Links to implementation plans and design proposals

**Epic**
- Groups related tickets into larger initiatives
- Defines business goals and success metrics
- Tracks progress across multiple tickets

**Implementation Plan**
- Documents technical approach for tickets
- Captures architectural decisions and alternatives
- Enables pre-implementation review and validation

#### Value Objects

**Status**: pending, in_progress, completed, archived
**Priority**: high, medium, low
**Type**: feature, bug, task, epic
**Privacy**: local-only, shareable, public

## 5. Technical Architecture

### 5.1. Technology Stack

**Runtime Environment**
- Node.js with ES modules
- TypeScript for type safety
- pnpm for package management

**CLI Framework**
- Commander.js for command structure
- tsx for TypeScript execution
- Chalk for terminal styling

**Storage**
- JSON files for structured data
- Markdown for documentation
- File-based templates

**AI Integration**
- Model Context Protocol (MCP) server (mandatory standard)
- Support for multiple AI providers
- Language bridging capabilities  
- AI Resource Management (optional)
- Git-style co-authorship model for AI operations
- AI-optional design (all basic features work without AI)

### 5.2. Data Storage

**Local Storage Structure**
```
project-root/
├── .pm/
│   ├── config.json
│   ├── project.json
│   ├── tickets/
│   │   ├── ticket-001.json
│   │   └── ticket-002.json
│   ├── epics/
│   │   └── epic-001.json
│   └── templates/
│       ├── issue-template.md
│       └── epic-template.md
└── docs/
    └── [project documentation]
```

**Data Format**
- JSON for structured data (tickets, epics, configuration)
- Markdown for documentation and templates
- Timestamps for chronological ordering
- Lock files for concurrent access control (item-level granularity)
- **Version Control**: Snapshot-based storage initially, with future migration to diff-based storage
- **Co-authorship Tracking**: Record both AI agent and human instructor for all AI operations

## 6. Integration Architecture

### 6.1. MCP Server Implementation

**Core Services**
- Ticket management operations
- Project context retrieval
- AI-assisted validation workflows
- Language translation services

**API Endpoints**
- CRUD operations for tickets and epics
- Search and filtering capabilities
- Status reporting and analytics
- Template management

### 6.2. External System Integration

**Synchronization Strategy**
- External tool-based synchronization (not direct sync)
- User-driven conflict resolution with AI assistance
- Selective sharing based on privacy settings
- Audit trail for all changes

**Supported Systems**
- GitHub Issues
- Jira
- Linear
- Extensible plugin architecture

## 7. Security Architecture

### 7.1. Local Security

- File system permissions for data protection
- Secure storage of API keys and credentials
- Audit logging for all operations
- Privacy controls for sensitive information
- **AI Operation Safeguards**: User confirmation steps before AI executes destructive operations
- **Operation Risk Assessment**: Categorize operations by risk level (high/medium/low) to determine appropriate safeguards

### 7.2. Integration Security

- OAuth 2.0 for external system authentication
- API key rotation and management
- Rate limiting and throttling
- Data sanitization and validation

## 8. Development Guidelines

### 8.1. Implementation Approach

- **Domain-Driven Design**: Focus on core domain concepts
- **Test-Driven Development**: Tests before implementation
- **Document-Driven Development**: Clear specifications
- **AI-Assisted Development**: Leverage AI for efficiency

### 8.2. Quality Assurance

- Comprehensive test coverage (unit, integration, E2E)
- Static analysis and linting
- Security scanning and vulnerability assessment
- Performance monitoring and optimization

## 9. Future Considerations

### 9.1. Scalability

- Plugin architecture for extensibility
- Multi-project support
- Team collaboration features
- Enterprise-grade security

### 9.2. User Experience

- Web-based UI for visual project management
- Mobile companion app
- Real-time notifications
- Advanced analytics and reporting

### 9.3. AI Resource Management (Optional)

- Token usage monitoring dashboard
- Cross-project resource allocation
- Cost optimization algorithms
- Automatic context compression
- Model selection strategies
- Rate limit management
- Budget tracking and alerts

## 10. Related Documents

- [REQUIREMENTS.md](../domain/REQUIREMENTS.md) - User requirements that this architecture implements
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Development methodologies and guidelines
- [TEST_STRATEGY.md](../TEST_STRATEGY.md) - Comprehensive testing approach
- [CLAUDE.md](../../CLAUDE.md) - AI assistant project instructions and context