# ADR-0009: Project-Specific Workflow Values

## Status

Accepted

## Context

Different projects have varying workflow requirements, priority schemes, and categorization needs. A one-size-fits-all approach to ticket statuses, priorities, and types would limit the system's flexibility and prevent teams from adapting the tool to their specific processes.

### Current Implementation

Currently, the system uses hardcoded values for:
- **Ticket Status**: `pending`, `in_progress`, `completed`, `archived`
- **Ticket Priority**: `high`, `medium`, `low`  
- **Ticket Type**: `feature`, `bug`, `task`, `research`, `design`, `chore`

These values are scattered throughout the codebase as string literals and are not configurable per project.

### Problem

1. **Inflexibility**: Teams cannot customize workflows to match their existing processes
2. **Limited Scalability**: Adding new statuses or priorities requires code changes
3. **Maintenance Burden**: Changes to valid values require updates in multiple locations
4. **Cultural Mismatch**: Different organizations use different terminology and workflow patterns

### Future Requirements

The planned Project entity implementation will need to support:
- Custom state machines with project-specific transitions
- Configurable priority levels and meanings
- Project-specific ticket categorization schemes
- Validation of values against project configuration

## Decision

We will implement **project-specific workflow values** with the following approach:

### 1. Domain Layer Design

- **Maintain Branded Types**: Continue using `TicketStatusKey`, `TicketPriorityKey`, and `TicketTypeKey` branded types for type safety
- **Flexible Validation**: Current validation ensures proper format (lowercase, underscores) but doesn't restrict specific values
- **Future Project Entity**: Project entity will own the configuration of valid values and state machine definitions

### 2. Default Values Strategy

- **Provide Sensible Defaults**: Current hardcoded values serve as default configurations
- **Progressive Enhancement**: Teams can start with defaults and customize as needed
- **Backward Compatibility**: Existing data continues to work when custom workflows are introduced

### 3. Implementation Approach

- **Phase 1 (Current)**: Document the project-specific nature of these values
- **Phase 2 (Future)**: Implement Project entity with workflow configuration
- **Phase 3 (Future)**: Add UI/CLI commands for workflow customization

## Consequences

### Positive

- **Greater Flexibility**: Projects can define workflows that match their processes
- **Better Adoption**: Teams can adapt the tool to existing practices rather than changing practices to fit the tool
- **Scalability**: New workflow patterns can be supported without code changes
- **Type Safety**: Branded types prevent invalid values while allowing flexibility

### Negative

- **Increased Complexity**: Validation logic becomes more complex as it must check against project configuration
- **Migration Requirements**: Introducing custom workflows may require data migration for existing projects
- **Documentation Burden**: Need to clearly communicate that these values are project-specific to prevent confusion

### Neutral

- **Current Code Impact**: Minimal immediate changes required - mostly documentation updates
- **AI Assistant Behavior**: Clear documentation prevents AI systems from assuming fixed values

## Implementation Notes

### Current State

The domain layer already supports this design through branded types:

```typescript
export type TicketStatusKey = Brand<string, 'TicketStatusKey'>
export type TicketPriorityKey = Brand<string, 'TicketPriorityKey'>
export type TicketTypeKey = Brand<string, 'TicketTypeKey'>
```

### Future Development

When implementing the Project entity:

1. **Configuration Schema**: Define JSON schema for project workflow configuration
2. **State Machine**: Implement configurable state transitions
3. **Validation**: Update validation functions to check against project configuration
4. **Migration Tools**: Provide tools to migrate existing data to custom workflows

### Documentation Updates

- ✅ **Ubiquitous Language**: Updated to clarify project-specific nature
- **Architecture Documentation**: Update to reflect configurable workflows
- **API Documentation**: Clarify that valid values depend on project configuration

## References

- [Domain-Driven Design (ADR-0007)](./0007-domain-driven-design-adoption.md)
- [Clean Architecture (ADR-0008)](./0008-clean-architecture-adoption.md)
- [Ubiquitous Language](../../reference/ubiquitous-language.md)