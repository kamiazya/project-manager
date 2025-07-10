# Project Manager Documentation

Welcome to the Project Manager documentation. This guide helps you navigate through our comprehensive documentation structure organized following the Diátaxis framework.

## Documentation Structure Overview

Our documentation is organized into four categories based on user needs:

```
/docs/
├── README.md                  # This file - Documentation navigation guide
├── tutorials/                 # Learning-oriented guides for newcomers
├── guides/                    # Task-oriented how-to guides
│   ├── testing-strategy.md    # How to test the system
│   └── asynchronous-delegation.md # Best practices for async work
├── reference/                 # Information-oriented technical descriptions
│   ├── architecture.md        # System architecture specification
│   └── ubiquitous-language.md # Domain terminology reference
└── explanation/               # Understanding-oriented conceptual discussions
    ├── domain-overview.md     # Business domain explanation
    ├── context-map.md         # Bounded contexts visualization
    ├── architecture-overview.md # Architecture concepts
    └── adr/                   # Architecture Decision Records
```

## Navigation Guide

### For Different Audiences

#### 🎓 New Contributors
Start your learning journey:
1. **Tutorials** - Step-by-step learning guides (coming soon)
2. [Domain Overview](./explanation/domain-overview.md) - Understand the business domain
3. [CONTRIBUTING.md](../CONTRIBUTING.md) - Development setup and workflow

#### 🔧 Developers & Contributors
Find practical guidance:
1. [Testing Strategy](./guides/testing-strategy.md) - How to test your changes
2. [Asynchronous Delegation](./guides/asynchronous-delegation.md) - Best practices for distributed work
3. [Architecture Reference](./reference/architecture.md) - Technical specifications

#### 📚 Looking for Specific Information
Quick reference materials:
1. [Architecture Reference](./reference/architecture.md) - Complete technical specification
2. [Ubiquitous Language](./reference/ubiquitous-language.md) - Domain terminology
3. [CLI Reference](./reference/) - Command documentation (coming soon)

#### 🤔 Understanding Concepts
Dive deeper into the "why":
1. [Domain Overview](./explanation/domain-overview.md) - Business concepts and user needs
2. [Context Map](./explanation/context-map.md) - System boundaries and relationships
3. [Architecture Decisions](./explanation/adr/) - Why we made specific technical choices

#### 🤖 AI Assistants
For understanding project context:
1. [Ubiquitous Language](./reference/ubiquitous-language.md) - Domain terminology
2. [CLAUDE.md](../CLAUDE.md) - AI-specific instructions
3. [Domain Overview](./explanation/domain-overview.md) - Business context

### By Document Type

#### 📖 Tutorials (Learning-oriented)
*Coming soon: Step-by-step guides for newcomers*
- Getting started tutorial
- Development environment setup

#### 📝 How-to Guides (Task-oriented)
- [Testing Strategy](./guides/testing-strategy.md) - How to test the system
- [Asynchronous Delegation](./guides/asynchronous-delegation.md) - Best practices for distributed work

#### 📋 Reference (Information-oriented)
- [Architecture](./reference/architecture.md) - Complete system specification
- [Ubiquitous Language](./reference/ubiquitous-language.md) - Domain terminology reference

#### 💡 Explanation (Understanding-oriented)
- [Domain Overview](./explanation/domain-overview.md) - Business domain concepts
- [Context Map](./explanation/context-map.md) - System boundaries visualization
- [Architecture Overview](./explanation/architecture-overview.md) - Architecture principles
- [Architecture Decisions](./explanation/adr/) - Decision rationale and context

## Key Documentation Principles

### 1. Diátaxis Framework
Documentation is organized by user intent:
- **Tutorials**: "I want to learn"
- **How-to guides**: "I want to accomplish a task"
- **Reference**: "I want to look up information"
- **Explanation**: "I want to understand"

### 2. Single Source of Truth
- Each piece of information has one authoritative location
- Cross-references point to the definitive source
- Reduces duplication and maintenance burden

### 3. Progressive Disclosure
- Start with overviews and drill down as needed
- Clear navigation between related concepts
- Appropriate level of detail for each document type

### 4. Living Documentation
- Documentation evolves with the system
- Changes follow the same review process as code
- Regular reviews ensure accuracy and relevance

## Documentation Maintenance

### Adding New Documentation

1. **Determine the category** based on user intent:
   - Tutorial: Teaching newcomers
   - Guide: Solving specific problems
   - Reference: Looking up information
   - Explanation: Understanding concepts

2. **Follow existing patterns** and maintain consistency
3. **Update navigation** in this README.md
4. **Add cross-references** to related documents

### Quality Guidelines

- Use clear, concise language
- Include examples and diagrams where helpful
- Maintain consistent formatting
- Keep content focused on the document's category purpose

## Quick Links

### Essential Documents
- [CONTRIBUTING.md](../CONTRIBUTING.md) - How to contribute
- [README.md](../README.md) - Project overview
- [CLAUDE.md](../CLAUDE.md) - AI assistant instructions

### Start Here
- [Domain Overview](./explanation/domain-overview.md) - What this system does
- [Testing Strategy](./guides/testing-strategy.md) - How to test your changes
- [Architecture Reference](./reference/architecture.md) - Technical specification

### Deep Dive
- [Context Map](./explanation/context-map.md) - System organization
- [Architecture Decisions](./explanation/adr/) - Why we made these choices
- [Ubiquitous Language](./reference/ubiquitous-language.md) - Domain terminology

## Getting Help

If you can't find what you're looking for:

1. **Check the appropriate category** based on your need (tutorial, guide, reference, explanation)
2. **Search the ubiquitous language** for terminology clarification
3. **Review related architecture decisions** for context
4. **Consult CONTRIBUTING.md** for development questions
5. **Create an issue** for documentation improvements

Remember: Well-organized documentation enables effective collaboration between humans and AI assistants!