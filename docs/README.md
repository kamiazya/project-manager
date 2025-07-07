# Project Manager Documentation

Welcome to the Project Manager documentation. This guide helps you navigate through our comprehensive documentation structure organized following Domain-Driven Design (DDD) principles.

## Documentation Structure Overview

```
/docs/
├── README.md                  # This file - Documentation navigation guide
├── domain/                    # Business domain concepts (WHAT the system does)
│   ├── README.md              # Domain overview and key concepts
│   ├── USER_STORIES.md        # User personas and scenarios
│   └── UBIQUITOUS_LANGUAGE.md # Centralized glossary of domain terms
├── architecture/              # Technical architecture (HOW it's built)
│   ├── README.md              # Architecture principles and overview
│   ├── ARCHITECTURE.md        # System architecture details
│   ├── CONTEXT_MAP.md         # Bounded context relationships visualization
│   └── adr/                   # Architecture Decision Records
│       ├── README.md          # ADR overview and index
│       └── TEMPLATE.md        # ADR template
└── contexts/                  # Bounded contexts (detailed domain models)
    ├── README.md              # Bounded contexts overview
    ├── ticket_management/     # Core ticket and project management
    │   ├── README.md          # Context overview
    │   ├── DOMAIN_MODEL.md    # Entities and aggregates
    │   ├── WORKFLOWS.md       # Business processes
    │   └── CONSTRAINTS.md     # Non-functional requirements
    ├── ai_integration/        # AI assistant collaboration
    │   └── (same structure as above)
    └── external_sync/         # External system integration
        └── (same structure as above)
```

## Navigation Guide

### For Different Audiences

#### 🏢 Product Managers & Stakeholders
Start with high-level business understanding:
1. [Domain Overview](./domain/README.md) - Core concepts and business value
2. [User Stories](./domain/USER_STORIES.md) - User personas and scenarios
3. [Context Map](./architecture/CONTEXT_MAP.md) - System boundaries visualization

#### 👩‍💻 Developers & Technical Contributors
For implementation and technical details:
1. [Architecture Overview](./architecture/ARCHITECTURE.md) - System design
2. [Bounded Contexts](./contexts/README.md) - Detailed domain models
3. [CONTRIBUTING.md](../CONTRIBUTING.md) - Development guidelines

#### 🤖 AI Assistants
For understanding project context:
1. [Ubiquitous Language](./domain/UBIQUITOUS_LANGUAGE.md) - Domain terminology
2. [CLAUDE.md](../CLAUDE.md) - AI-specific instructions
3. Relevant bounded context documentation

#### 🔧 Integration Engineers
For external system integration:
1. [External Sync Context](./contexts/external_sync/) - Integration patterns
2. [Context Map](./architecture/CONTEXT_MAP.md) - Integration boundaries
3. [Architecture Decisions](./architecture/adr/) - Technology choices

### By Purpose

#### Understanding the Business Domain
- **Start**: [Domain README](./domain/README.md)
- **Deep Dive**: [User Stories](./domain/USER_STORIES.md)
- **Terminology**: [Ubiquitous Language](./domain/UBIQUITOUS_LANGUAGE.md)

#### Understanding the Architecture
- **Overview**: [Architecture](./architecture/ARCHITECTURE.md)
- **Relationships**: [Context Map](./architecture/CONTEXT_MAP.md)
- **Decisions**: [ADRs](./architecture/adr/)

#### Working with Specific Features
- **Ticket Management**: [Ticket Management Context](./contexts/ticket_management/)
- **AI Features**: [AI Integration Context](./contexts/ai_integration/)
- **External Systems**: [External Sync Context](./contexts/external_sync/)

## Key Documentation Principles

### 1. Domain-Driven Design (DDD) Organization
Documentation mirrors the system's bounded contexts, making it easier to:
- Find relevant information for specific features
- Understand dependencies and relationships
- Maintain consistency within contexts

### 2. Separation of Concerns
- **Domain** (What): Business concepts independent of implementation
- **Architecture** (How): Technical design and system structure
- **Contexts** (Details): Specific implementations within boundaries

### 3. Progressive Disclosure
- Start with high-level overviews
- Drill down into specific contexts as needed
- Cross-references guide deeper exploration

### 4. Living Documentation
- Documentation evolves with the system
- Changes follow the same review process as code
- Regular reviews ensure accuracy

## Documentation Maintenance

### Adding New Documentation
1. Determine the appropriate location based on content type
2. Follow existing patterns and templates
3. Update relevant index/navigation files
4. Add cross-references to related documents

### Updating Existing Documentation
1. Make changes in the appropriate document
2. Update any impacted cross-references
3. Consider if architectural decisions need documenting
4. Ensure consistency with Ubiquitous Language

### Quality Guidelines
- Use clear, concise language
- Include examples and diagrams where helpful
- Maintain consistent formatting
- Keep technical jargon in appropriate contexts

## Quick Links

### Essential Documents
- [CONTRIBUTING.md](../CONTRIBUTING.md) - How to contribute
- [README.md](../README.md) - Project overview
- [CLAUDE.md](../CLAUDE.md) - AI assistant instructions

### Domain Understanding
- [Ubiquitous Language](./domain/UBIQUITOUS_LANGUAGE.md) - Key terminology
- [User Stories](./domain/USER_STORIES.md) - User scenarios
- [Context Map](./architecture/CONTEXT_MAP.md) - System boundaries

### Technical Details
- [Architecture](./architecture/ARCHITECTURE.md) - System design
- [Bounded Contexts](./contexts/) - Detailed implementations
- [ADRs](./architecture/adr/) - Design decisions

## Getting Help

If you can't find what you're looking for:
1. Check the [Ubiquitous Language](./domain/UBIQUITOUS_LANGUAGE.md) for terminology
2. Review the [Context Map](./architecture/CONTEXT_MAP.md) for system organization
3. Consult [CONTRIBUTING.md](../CONTRIBUTING.md) for development questions
4. Create an issue for documentation improvements

Remember: Good documentation is crucial for successful collaboration between humans and AI assistants!
