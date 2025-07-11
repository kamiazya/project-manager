# Coding Guidelines

This document provides coding standards and best practices for the Project Manager codebase. These guidelines ensure consistency, maintainability, and quality across all packages.

## Table of Contents

1. [General Principles](#general-principles)
2. [Domain-Driven Design (DDD)](#domain-driven-design-ddd)
3. [TypeScript Guidelines](#typescript-guidelines)
4. [Testing Guidelines](#testing-guidelines)
5. [Error Handling](#error-handling)
6. [Documentation](#documentation)
7. [Code Organization](#code-organization)

## General Principles

### Clean Code

- Write code that clearly expresses intent
- Use meaningful names for variables, functions, and classes
- Keep functions small and focused on a single responsibility
- Avoid premature optimization
- Refactor regularly to maintain code quality

### SOLID Principles

- **Single Responsibility**: Each class/function should have one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Subtypes must be substitutable for their base types
- **Interface Segregation**: Depend on abstractions, not concretions
- **Dependency Inversion**: High-level modules should not depend on low-level modules

## Domain-Driven Design (DDD)

### Bounded Context

- Start with "Ticket Management" as the primary bounded context
- Design future features (user management, analytics) as separate contexts
- Maintain clear boundaries between contexts
- Define explicit interfaces for cross-context communication

### Entities

Entities are domain objects with identity that persists over time.

```typescript
// Good: Entity with encapsulated business logic
export class Ticket {
  private constructor(
    private readonly id: TicketId,
    private title: TicketTitle,
    private status: TicketStatus
  ) {}

  // Factory method for controlled creation
  static create(title: string, description: string): Ticket {
    const id = TicketId.generate();
    const titleVO = TicketTitle.create(title);
    const descriptionVO = TicketDescription.create(description);
    return new Ticket(id, titleVO, TicketStatus.pending());
  }

  // Business operations as methods
  startProgress(): void {
    if (!this.status.canTransitionTo('in_progress')) {
      throw new InvalidStateTransition();
    }
    this.status = TicketStatus.inProgress();
  }
}
```

**Guidelines:**

- Use private constructors with static factory methods
- Encapsulate all business rules within the entity
- Never expose setters that could break invariants
- Use method names that reflect business operations

### Value Objects

Value Objects are immutable objects without identity, defined by their attributes.

```typescript
// Good: Immutable value object with validation
export class TicketTitle {
  private constructor(private readonly value: string) {}

  static create(value: string): TicketTitle {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new ValidationError('Title cannot be empty');
    }
    if (trimmed.length > 200) {
      throw new ValidationError('Title cannot exceed 200 characters');
    }
    return new TicketTitle(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: TicketTitle): boolean {
    return this.value === other.value;
  }
}
```

**Guidelines:**

- Make all properties `readonly`
- Validate in the factory method or constructor
- Provide `equals()` method for value comparison
- Include `toString()` for easy serialization
- Never mutate - always return new instances

### Domain Services

Domain Services handle operations that don't naturally belong to a single entity.

```typescript
// Good: Stateless domain service
export class TicketPriorityService {
  calculatePriority(
    ticket: Ticket,
    projectDeadline: Date,
    dependencies: Ticket[]
  ): Priority {
    // Complex business logic that spans multiple entities
    const daysUntilDeadline = this.calculateDaysUntil(projectDeadline);
    const blockingCount = dependencies.filter(d => d.isBlocking()).length;
    
    if (daysUntilDeadline < 7 && blockingCount > 0) {
      return Priority.high();
    }
    // ... more business logic
  }
}
```

**Guidelines:**

- Keep services stateless
- Name services to clearly express their purpose
- Focus on domain logic, not infrastructure
- Use when logic doesn't belong to a single entity

### Repository Pattern

Repositories provide abstractions for data persistence while keeping domain objects pure.

```typescript
// Good: Domain-focused repository interface
export interface ITicketRepository {
  findById(id: TicketId): Promise<Ticket | null>;
  findByStatus(status: TicketStatus): Promise<Ticket[]>;
  save(ticket: Ticket): Promise<void>;
  remove(id: TicketId): Promise<void>;
}

// Infrastructure implementation (separate layer)
export class JsonTicketRepository implements ITicketRepository {
  async save(ticket: Ticket): Promise<void> {
    const data = this.mapper.toPersistence(ticket);
    await this.storage.write(data);
  }
}
```

**Guidelines:**

- Define interfaces in the domain layer
- Keep interfaces focused on domain operations
- Implement mapping logic in infrastructure layer
- Never expose persistence details to domain

### Aggregates

Aggregates define consistency boundaries and transaction scopes.

```typescript
// Good: Aggregate root with consistency enforcement
export class Project {
  private tickets: Ticket[] = [];

  addTicket(ticket: Ticket): void {
    // Enforce aggregate invariants
    if (this.tickets.length >= this.maxTickets) {
      throw new ProjectLimitExceeded();
    }
    if (this.isCompleted()) {
      throw new CannotAddToCompletedProject();
    }
    this.tickets.push(ticket);
  }
}
```

**Guidelines:**

- Start with single-entity aggregates
- Introduce multi-entity aggregates only when needed
- Enforce invariants at aggregate boundaries
- Keep aggregates small for better performance

## TypeScript Guidelines

### Type Safety

```typescript
// Good: Leverage TypeScript's type system
type TicketStatus = 'pending' | 'in_progress' | 'completed';

interface CreateTicketDto {
  title: string;
  description: string;
  priority?: Priority;
}

// Use branded types for compile-time safety
type TicketId = string & { readonly brand: unique symbol };
```

### Strict Configuration

Always use strict TypeScript configuration:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## Clean Architecture

Clean Architecture provides the structural framework for implementing our Domain-Driven Design. It defines explicit layers with clear dependency rules that complement DDD concepts.

### Architectural Layers

Clean Architecture defines four main layers with strict dependency rules:

```mermaid
---
title: Clean Architecture Layers
---
%%{init: {"theme": "neutral", "themeVariables": {"primaryColor": "#4caf50", "primaryTextColor": "#2e7d32", "primaryBorderColor": "#2e7d32"}}}%%
graph TB
    subgraph "Frameworks & Drivers"
        UI[User Interfaces]
        EXT[External Interfaces]
        DB[Database/Storage]
    end
    
    subgraph "Interface Adapters"
        CTRL[Controllers]
        GATE[Gateways]
        REPO_IMPL[Repository Implementations]
    end
    
    subgraph "Use Cases"
        APP[Application Services]
        REPO_INT[Repository Interfaces]
    end
    
    subgraph "Entities"
        ENT[Domain Entities]
        VO[Value Objects]
        DS[Domain Services]
    end
    
    %% Dependencies flow inward
    UI --> CTRL
    EXT --> GATE
    DB --> REPO_IMPL
    
    CTRL --> APP
    GATE --> APP
    REPO_IMPL --> REPO_INT
    
    APP --> ENT
    APP --> VO
    APP --> DS
    REPO_INT --> ENT
    
    %% Styling
    classDef outer fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px
    classDef adapter fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef usecase fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef entity fill:#e3f2fd,stroke:#2196f3,stroke-width:3px
    
    class UI,EXT,DB outer
    class CTRL,GATE,REPO_IMPL adapter
    class APP,REPO_INT usecase
    class ENT,VO,DS entity
```

### Layer Responsibilities

**Entities Layer (Inner Layer)**

- Domain entities and value objects
- Enterprise business rules
- Core business logic
- No dependencies on outer layers

```typescript
// Good: Pure domain entity
export class Ticket {
  private constructor(props: TicketProps) {
    this.props = props;
  }

  static create(data: CreateTicketData): Ticket {
    const ticket = new Ticket({
      id: TicketId.create(),
      title: TicketTitle.create(data.title),
      status: TicketStatus.pending(),
      // ... other properties
    });
    return ticket;
  }

  // Business operations
  startProgress(): void {
    if (!this.status.canTransitionTo('in_progress')) {
      throw new InvalidStatusTransition();
    }
    this.status = TicketStatus.inProgress();
  }
}
```

**Use Cases Layer (Application Layer)**

- Application-specific business rules
- Orchestrates data flow between entities
- Depends only on inner layers and interfaces

```typescript
// Good: Use case with dependency inversion
@injectable()
export class TicketUseCase {
  constructor(
    @inject(TYPES.TicketRepository)
    private readonly ticketRepository: TicketRepository
  ) {}

  async createTicket(data: CreateTicketData): Promise<Ticket> {
    const ticket = Ticket.create(data);
    await this.ticketRepository.save(ticket);
    return ticket;
  }
}
```

**Interface Adapters Layer**

- Converts data between use cases and external systems
- Repository implementations
- External service adapters

```typescript
// Good: Repository implementation
@injectable()
export class JsonTicketRepository implements TicketRepository {
  async save(ticket: Ticket): Promise<void> {
    // Convert domain object to persistence format
    const ticketJson = TicketMapper.toPersistence(ticket);
    await this.writeToFile(ticketJson);
  }

  async findById(id: TicketId): Promise<Ticket | null> {
    const data = await this.readFromFile(id.value);
    return data ? TicketMapper.toDomain(data) : null;
  }
}
```

**Frameworks & Drivers Layer (Outer Layer)**

- External frameworks and tools
- CLI commands, web controllers
- Database drivers

```typescript
// Good: CLI command
export function createTicketCommand(): Command {
  return new Command('create')
    .action(async (title: string, description: string) => {
      const ticketUseCase = getTicketUseCase();
      const ticket = await ticketUseCase.createTicket({ title, description });
      console.log(formatTicket(ticket));
    });
}
```

### Dependency Rules

1. **Dependency Direction**: Dependencies point inward only
2. **Interface Segregation**: Outer layers depend on inner layer interfaces
3. **Stable Dependencies**: Inner layers are more stable than outer layers
4. **Framework Independence**: Business logic independent of frameworks

```typescript
// Good: Interface in inner layer
export interface TicketRepository {
  save(ticket: Ticket): Promise<void>;
  findById(id: TicketId): Promise<Ticket | null>;
}

// Good: Implementation in outer layer
export class JsonTicketRepository implements TicketRepository {
  // Implementation details
}

// Bad: Direct dependency on implementation
export class TicketUseCase {
  constructor(private repo: JsonTicketRepository) {} // ❌ Depends on concrete class
}

// Good: Dependency on interface
export class TicketUseCase {
  constructor(private repo: TicketRepository) {} // ✅ Depends on abstraction
}
```

### Integration with DDD

Clean Architecture layers map naturally to DDD concepts:

- **Entities Layer**: Domain entities, value objects, domain services
- **Use Cases Layer**: Application services, repository interfaces
- **Interface Adapters Layer**: Repository implementations, anti-corruption layers
- **Frameworks & Drivers Layer**: User interfaces, external APIs

### Common Mistakes to Avoid

**Violating Dependency Direction**

```typescript
// Bad: Inner layer depending on outer layer
export class Ticket {
  save(): void {
    const repo = new JsonTicketRepository(); // ❌ Domain depends on infrastructure
    repo.save(this);
  }
}

// Good: Outer layer depends on inner layer
export class TicketUseCase {
  constructor(private repo: TicketRepository) {} // ✅ Application depends on abstraction
}
```

**Mixing Layer Concerns**

```typescript
// Bad: Business logic in repository
export class JsonTicketRepository {
  async save(ticket: Ticket): Promise<void> {
    if (ticket.priority === 'high') {
      await this.sendUrgentNotification(); // ❌ Business logic in infrastructure
    }
    // ... save logic
  }
}

// Good: Business logic in domain
export class Ticket {
  markAsUrgent(): void {
    if (this.priority.isHigh()) {
      this.addDomainEvent(new UrgentTicketCreated(this.id)); // ✅ Business logic in domain
    }
  }
}
```

### Testing Strategy

Test each layer independently:

```typescript
// Test domain layer in isolation
describe('Ticket', () => {
  it('should transition to in_progress when started', () => {
    const ticket = Ticket.create({ title: 'Test', description: 'Test' });
    ticket.startProgress();
    expect(ticket.status.value).toBe('in_progress');
  });
});

// Test use case with mocked repository
describe('TicketUseCase', () => {
  it('should create and save ticket', async () => {
    const mockRepo = { save: jest.fn() } as jest.Mocked<TicketRepository>;
    const useCase = new TicketUseCase(mockRepo);
    
    await useCase.createTicket({ title: 'Test', description: 'Test' });
    
    expect(mockRepo.save).toHaveBeenCalledWith(expect.any(Ticket));
  });
});
```

## Testing Guidelines

### Test-Driven Development (TDD)

1. Write test first (Red)
2. Write minimal code to pass (Green)
3. Refactor while keeping tests green

```typescript
// Good: Descriptive test with AAA pattern
describe('Ticket', () => {
  describe('create', () => {
    it('should create a ticket with valid data', () => {
      // Arrange
      const title = 'Fix login bug';
      const description = 'Users cannot login with email';

      // Act
      const ticket = Ticket.create(title, description);

      // Assert
      expect(ticket).toBeDefined();
      expect(ticket.getTitle()).toBe(title);
      expect(ticket.getStatus()).toBe('pending');
    });

    it('should throw when title is empty', () => {
      // Arrange
      const emptyTitle = '';
      const description = 'Valid description';

      // Act & Assert
      expect(() => {
        Ticket.create(emptyTitle, description);
      }).toThrow(ValidationError);
    });
  });
});
```

### Testing Best Practices

- Test behavior, not implementation
- Use descriptive test names that explain the scenario
- Follow AAA pattern: Arrange, Act, Assert
- Test edge cases and error conditions
- Keep tests independent and isolated
- Use test doubles (mocks, stubs) sparingly

## Error Handling

### Custom Error Classes

```typescript
// Good: Domain-specific error with context
export class TicketValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message);
    this.name = 'TicketValidationError';
  }
}
```

### Error Handling Patterns

```typescript
// Good: Explicit error handling
async function updateTicket(id: string, data: UpdateTicketDto): Promise<Result<Ticket, Error>> {
  try {
    const ticket = await repository.findById(id);
    if (!ticket) {
      return Result.fail(new TicketNotFoundError(id));
    }
    
    ticket.update(data);
    await repository.save(ticket);
    
    return Result.ok(ticket);
  } catch (error) {
    if (error instanceof ValidationError) {
      return Result.fail(error);
    }
    // Log unexpected errors
    logger.error('Unexpected error updating ticket', { error, id });
    return Result.fail(new UnexpectedError());
  }
}
```

## Documentation

### Code Comments

```typescript
/**
 * Represents a development task or issue in the project management system.
 * 
 * Tickets follow a defined lifecycle: pending -> in_progress -> completed
 * and enforce business rules for valid state transitions.
 * 
 * @example
 * const ticket = Ticket.create('Fix login bug', 'Users cannot login');
 * ticket.startProgress();
 * ticket.complete();
 */
export class Ticket {
  // Implementation
}
```

### Documentation Guidelines

- Document "why" not "what" in comments
- Use JSDoc for public APIs
- Keep documentation close to code
- Update documentation with code changes
- Include examples for complex usage

## Code Organization

### Package Structure

```
packages/
├── core/                 # Domain logic
│   ├── entities/        # Domain entities
│   ├── value-objects/   # Value objects
│   ├── services/        # Domain services
│   ├── repositories/    # Repository interfaces
│   └── use-cases/       # Application services
├── infrastructure/       # Infrastructure implementations
│   ├── persistence/     # Repository implementations
│   ├── external/        # External service adapters
│   └── config/          # Configuration
└── presentation/         # User interfaces
    ├── cli/            # CLI commands
    ├── api/            # REST API
    └── shared/         # Shared UI utilities
```

### Import Organization

```typescript
// 1. Node.js built-ins
import { readFile } from 'fs/promises';
import { join } from 'path';

// 2. External dependencies
import { injectable, inject } from 'inversify';
import { z } from 'zod';

// 3. Internal packages
import { Ticket, TicketStatus } from '@project-manager/core';

// 4. Relative imports
import { validateInput } from './validators';
import type { Config } from './types';
```

## Continuous Improvement

These guidelines are living documentation. As the project evolves:

1. Update guidelines based on team experience
2. Add examples from actual code
3. Document decisions and rationale
4. Keep guidelines practical and actionable
5. Review and refine regularly

Remember: Guidelines are meant to help, not hinder. Use judgment and prioritize code clarity and maintainability over strict adherence to rules.
