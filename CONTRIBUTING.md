# CONTRIBUTING

Welcome to the Project Manager project! This document provides comprehensive guidelines for contributing to the project, including development processes, coding standards, and collaboration practices.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Philosophy](#development-philosophy)
3. [Development Process](#development-process)
   - [Pull Request-Based Development Workflow](#pull-request-based-development-workflow)
   - [Development Flow](#development-flow)
   - [Enhanced Issue Workflow Process](#enhanced-issue-workflow-process)
4. [Issue Management](#issue-management)
5. [Code Standards](#code-standards)
6. [Testing](#testing)
7. [Documentation](#documentation)
8. [Architecture Decisions](#architecture-decisions)
9. [AI Integration](#ai-integration)
10. [Review Process](#review-process)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm package manager
- Git

### Environment Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Type check all packages
pnpm run typecheck
```

### Project Structure

Project Manager follows a local-first architecture with these core components:
- **CLI Interface**: Command-line tools for developer productivity
- **Local Storage**: File-based persistence for tickets, epics, and project data
- **MCP Server**: Model Context Protocol implementation for AI integration
- **External Integrations**: Bidirectional synchronization with external systems

For detailed architecture information, see [ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Development Philosophy

### Foundational Philosophies

#### 1. Secure-by-Design Philosophy
Security is integrated into every phase of development:
- **Proactive Security**: Security controls and threat modeling built into design and architecture
- **Built-in Quality**: Quality and security ensured from the beginning through vulnerability scanning, license compliance, and security analysis

#### 2. Multi-faceted Shift-Left Approach
Testing, security, and quality assurance moved as early as possible in the development lifecycle:
- **Early Detection**: Issues identified during design and implementation to reduce costs and complexity
- **Continuous Feedback**: Real-time feedback through automated tools, pre-commit hooks, and CI/CD checks

### Core Methodologies

The project integrates four key methodologies:

#### 1. AI-Driven Development
- Leverage AI as a development partner for efficiency and quality
- Utilize AI for code generation, review, and refactoring suggestions
- Combine human creativity with AI processing capabilities

#### 2. Domain-Driven Design (DDD)
- Design centered around business logic
- Clear communication through ubiquitous language
- Manage complexity through bounded contexts

#### 3. Document-Driven Development
- Clarify specifications through documentation before implementation
- Share knowledge by keeping documentation up-to-date
- Maintain consistency between code and documentation

#### 4. Test-Driven Development (TDD)
- Build quality through test-first approach
- Tests as executable specifications
- Safety net for refactoring

## Development Process

### Pull Request-Based Development Workflow

All code changes must be submitted through pull requests. This ensures code quality, knowledge sharing, and maintains a clear history of changes.

#### Branch Strategy

- **`main`**: Protected branch containing stable code
- **`feature/*`**: New feature development
- **`fix/*`**: Bug fixes
- **`docs/*`**: Documentation updates

#### Development Flow

1. **Create Feature Branch**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow the development principles below
   - Commit frequently with clear messages
   - Keep commits focused and atomic

3. **Create Pull Request**
   - Push your branch to remote
   - Create PR with descriptive title
   - Fill out PR description with:
     - Summary of changes
     - Why the change is needed
     - Related issues (if any)

4. **Review and Merge**
   - Self-review is acceptable for solo developers
   - Ensure all checks pass (when CI is set up)
   - Update branch with latest main if needed
   - Use "Squash and merge" to keep history clean

5. **Post-Merge**
   - Delete the feature branch
   - Pull latest main locally

#### PR Best Practices

- Keep PRs focused and small when possible
- Write clear, descriptive commit messages
- Update documentation alongside code changes
- Link related issues using keywords (closes #123)

### Development Flow

1. **Understand and Analyze**: Understand requirements and analyze domain model
2. **Design and Document**: Design architecture and document it
3. **Design Tests**: Express acceptance criteria as tests
4. **Implement**: Implement using TDD cycle
5. **Review and Improve**: Continuous review and improvement

### Key Principles

- **Iterative Development**: Continuous improvement through small cycles
- **Early Feedback**: Utilize feedback from both AI and humans
- **Knowledge Sharing**: Formalize knowledge through documentation and code

### Enhanced Issue Workflow Process

#### Phase 1: Design Proposal Creation
1. **Create Design Proposal**: Fill out the generated design proposal template
2. **Clarify Purpose and Goals**: Expand on the original issue's objectives
3. **Document Implementation Approach**: Specify technical choices and architecture
4. **Consider Alternatives**: Document other approaches and justify the chosen one

#### Phase 2: AI Expert Validation
1. **Request AI Expert Reviews**: Use validation commands
2. **Code Analysis Review**: Get architecture and structure feedback
3. **Technical Implementation Review**: Get API and library guidance
4. **Design & Architecture Review**: Get system design validation
5. **AI-Generated Proposals**: Use integrated AI for implementation suggestions
6. **Translation Support**: Convert proposals between languages as needed
7. **Synthesize Feedback**: Combine insights and resolve conflicts

#### Phase 3: Implementation
1. **Finalize Implementation Plan**: Based on AI expert feedback
2. **Begin Development**: Proceed with validated approach
3. **Progress Tracking**: Update issue files with discoveries and decisions
4. **Create New Issues**: Document emerging problems or requirements
5. **Maintain TODO Lists**: Sync TodoWrite tool with issue status

### Issue Status Workflow

```
todo → in_progress → completed
  ↓                     ↓
[GitHub Issues]      archived (if no GitHub migration needed)
```

- **todo**: Issue identified, ready to be worked on
- **in_progress**: Currently being worked on
- **completed**: Work finished successfully
- **archived**: Completed (no GitHub migration needed)

### Issue ID Format

Issues use UNIX timestamp-based IDs for automatic chronological ordering:
- Format: `TIMESTAMP-description.md`
- Example: `1751764474-static-analysis-linting.md`
- No need to check existing IDs when creating new issues

## Issue Management

### Hierarchical Problem Decomposition

Issues are organized in a three-tier hierarchy:

```
Epic (Strategic Level)
├── Feature (Functional Level)
    ├── Task (Implementation Level)
    ├── Task (Implementation Level)
    └── Task (Implementation Level)
```

#### Epic Level (Strategic)
- **Purpose**: Large strategic goals spanning multiple features
- **Duration**: 1-3 months
- **Ownership**: Human-driven decision making
- **Example**: "Complete user authentication system overhaul"

#### Feature Level (Functional)
- **Purpose**: User-facing functionality that provides business value
- **Duration**: 1-4 weeks
- **Ownership**: Human-AI collaborative planning
- **Example**: "Implement email/password authentication"

#### Task Level (Implementation)
- **Purpose**: Concrete implementation work that AI can execute autonomously
- **Duration**: 1-5 days
- **Ownership**: AI-driven execution with human oversight
- **Example**: "Implement login API endpoint with validation"

### Single Responsibility Principle

Each Task must adhere to the Single Responsibility Principle:

#### ✅ Good Task Examples
- `coding`: Implement the `loginUser` function in `auth.service.ts`
- `test`: Write unit tests for password validation with 90%+ coverage
- `refactor`: Extract authentication logic into reusable service class
- `research`: Investigate OAuth 2.0 libraries compatible with our stack

#### ❌ Poor Task Examples
- `coding`: Implement entire authentication system (too broad)
- `refactor`: Improve code quality (too vague)
- `research`: Research authentication (too open-ended)

### Issue Creation Standards

#### Frontmatter Schema
```yaml
---
id: unique-identifier
title: "Descriptive title"
type: epic|feature|task
status: todo|in_progress|completed|archived
priority: high|medium|low
created_at: YYYY-MM-DD
author: Creator name
labels:
  - category
  - technology
depends_on:
  - prerequisite-issue-id
blocks:
  - dependent-issue-id
parent_id: parent-issue-id  # For feature/task hierarchy
ai_metadata:
  complexity_score: 1-5
  estimated_effort: hours
  related_files:
    - file/path
  tags:
    - descriptive-tag
---
```

#### Mandatory Task Components

Every Task-level issue must include:

1. **Clear Completion Criteria**
   ```markdown
   ## Success Criteria
   - [ ] Function `authenticateUser()` implemented in `src/auth/service.ts`
   - [ ] Input validation for email format and password strength
   - [ ] Error handling for invalid credentials
   - [ ] Unit tests with 90%+ coverage
   ```

2. **Context Information**
   ```markdown
   ## Context
   **Files to modify**: `src/auth/service.ts`, `src/auth/types.ts`
   **Dependencies**: bcrypt, validator
   **Related documentation**: [Authentication Flow](docs/auth-flow.md)
   ```

3. **AI Metadata**
   ```yaml
   ai_metadata:
     complexity_score: 3  # 1-5 scale
     estimated_effort: 4   # hours
     related_files:
       - src/auth/service.ts
       - src/auth/types.ts
     tags:
       - backend
       - security
       - api
   ```

## Code Standards

### Technology Stack

- **Node.js**: Primary runtime environment with ES modules
- **TypeScript**: Comprehensive type safety across all packages
- **pnpm**: Monorepo package management with workspaces
- **Commander.js**: CLI framework for structured command hierarchies
- **tsx**: Direct TypeScript execution for development efficiency

### Coding Conventions

- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Use meaningful variable and function names
- Write clear, concise comments when necessary
- Follow the existing code style and patterns

### Security Best Practices

- Never expose or log secrets and keys
- Never commit secrets or keys to the repository
- Follow secure coding practices
- Validate all user inputs
- Use proper error handling

## Testing

### Testing Philosophy

- **Test-Driven Development**: Tests are written before implementation
- **Quality Built-In**: Testing is integral to the development process
- **Shift-Left Testing**: Early and continuous testing throughout development
- **AI-Assisted Testing**: Leverage AI for test generation and validation

### Test Levels

#### Unit Testing
- **Scope**: Individual functions, classes, and modules
- **Coverage Target**: 90%+ for core business logic
- **Technology**: Vitest testing framework
- **Categories**: Domain model validation, business logic verification, utility function testing, error handling scenarios

#### Integration Testing
- **Scope**: Component interactions and API endpoints
- Test component integration and data flow
- Verify external system interactions

#### End-to-End Testing
- **Scope**: Full system workflows and user interactions
- Test complete user journeys
- Validate system behavior in production-like environments

### Test Environment Setup

**Requirements**:
- Node.js 20+
- pnpm package manager

**Running Tests**:
```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

## Documentation

### Documentation Philosophy

- **Single Source of Truth (DRY)**: Each piece of information has one authoritative home
- **Audience-Centric**: Each document serves a specific primary audience
- **Purpose-Driven**: Each document answers specific questions
- **Discoverability**: Central entry points guide users to relevant information

### Documentation Standards

- Use clear, concise language
- Include examples and code snippets
- Keep documentation up-to-date with code changes
- Use proper Markdown formatting
- Cross-reference related documents

### Document Types

- **REQUIREMENTS.md**: What the system must do from user/business perspective
- **ARCHITECTURE.md**: How the system is built to meet requirements
- **TEST_STRATEGY.md**: How we verify implementation meets requirements and design
- **DEVELOPMENT_PROCESS.md**: How the team collaborates to build and deliver software
- **ADRs**: Why architectural decisions were made and their consequences

## Architecture Decisions

### When to Create ADRs

Create an ADR when making decisions that:
- **Cross bounded contexts** or affect multiple system components
- **Introduce new technologies** or third-party dependencies
- **Define major interfaces** or API contracts
- **Establish architectural patterns** or design principles
- **Impact system qualities** like performance, security, or scalability
- **Require significant effort** to reverse or modify later

### ADR Lifecycle

1. **Proposed**: Initial draft created during design discussion
2. **Accepted**: Decision approved and ready for implementation
3. **Deprecated**: Decision no longer recommended but still in use
4. **Superseded**: Decision replaced by a newer ADR

### ADR Quality Guidelines

- **Be concise but complete**: Include necessary context without excessive detail
- **Use clear language**: Avoid jargon except for well-defined domain terms
- **Include measurable consequences**: Specify how success will be evaluated
- **Reference supporting materials**: Link to relevant documentation or research
- **Consider future maintainers**: Write for developers who weren't involved in the decision

For detailed ADR guidelines, see [Architecture Decision Records](./docs/architecture/adr/README.md).

## AI Integration

### AI-Driven Development Guidelines

- Leverage AI as a development partner to improve efficiency and quality
- Use AI for code generation, review, and refactoring suggestions
- Combine human creativity with AI processing capabilities
- Maintain human oversight of AI-generated code

### AI Expert Validation

Use AI experts for:
- Architecture review and code structure analysis
- Technical implementation guidance
- API design and error handling
- System design patterns and scalability considerations
- Architectural decision validation

### AI-Assisted Quality Assurance

Apply the Second Opinion Principle: leverage multiple AI systems for independent validation and critical evaluation.

## Review Process

### Code Review Standards

- All code changes require review before merging
- Focus on code quality, security, and maintainability
- Verify tests are included and passing
- Check documentation updates are included
- Ensure architectural decisions are documented

### Design Review Workflow

For complex changes:
1. Create design proposal
2. Get AI expert validation
3. Review with team members
4. Document decisions in ADRs if needed
5. Implement with proper testing

### Quality Gates

Before marking work as complete:
- [ ] All success criteria met
- [ ] No breaking changes introduced
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Code reviewed and approved

## Related Documents

- [ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md) - System architecture and design decisions
- [TEST_STRATEGY.md](./docs/TEST_STRATEGY.md) - Comprehensive testing approach
- [Documentation Overview](./docs/README.md) - Documentation structure and navigation
- [Architecture Decision Records](./docs/architecture/adr/README.md) - Architectural decisions and their rationale
- [CLAUDE.md](./CLAUDE.md) - AI assistant project instructions and context

## Getting Help

If you have questions or need help:
- Check the documentation in the `docs/` directory
- Review existing issues and ADRs
- Create a new issue with your question
- Follow the issue management guidelines for proper categorization

Thank you for contributing to Project Manager!