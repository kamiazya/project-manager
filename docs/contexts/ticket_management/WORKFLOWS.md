# Ticket Management Workflows

This document details the key business processes and workflows within the Ticket Management bounded context.

## Ticket Lifecycle Workflows

### Ticket Creation Workflow

**Purpose**: Create a new ticket with all required information and validations.

**Actors**: Developer, Project Manager, AI Assistant

**Preconditions**:
- User has permission to create tickets in the project
- Project exists and is not archived

**Main Flow**:
```
1. User initiates ticket creation
2. System validates user permissions
3. User provides ticket information:
   - Title (required)
   - Description (required)
   - Type (required)
   - Priority (defaults to medium)
   - Acceptance criteria (required)
4. System validates ticket data:
   - Title length (10-200 characters)
   - Description completeness
   - Valid type selection
5. System generates unique ticket ID
6. System sets initial status to 'pending'
7. System records creation metadata:
   - Created by user
   - Creation timestamp
   - Initial privacy level
8. System adds ticket to project
9. System emits TicketCreated event
10. System returns created ticket
```

**Alternative Flows**:
- **3a.** If creating sub-issue:
  - Validate parent ticket exists
  - Inherit epic from parent
  - Set parent reference
- **4a.** If validation fails:
  - Return specific error messages
  - Allow user to correct and retry

**Postconditions**:
- Ticket exists in pending status
- Ticket is discoverable in project
- Creation event is logged

### Ticket Assignment Workflow

**Purpose**: Assign a ticket to a user following business rules.

**Actors**: Project Manager, Developer, AI Assistant

**Preconditions**:
- Ticket exists and is not completed/archived
- Assignee is a project contributor
- Assignee has no other in_progress tickets

**Main Flow**:
```
1. User requests ticket assignment
2. System validates assignment permissions
3. System checks assignee availability:
   - Is active project contributor
   - Has no other in_progress tickets
   - Has required permissions
4. System updates ticket assignee
5. If ticket was unassigned:
   - Send assignment notification
6. If reassigning:
   - Notify previous assignee
   - Record reassignment reason
7. System records assignment in history
8. System emits TicketAssigned event
9. Return updated ticket
```

**Alternative Flows**:
- **3a.** If assignee unavailable:
  - Return specific reason
  - Suggest available assignees
- **3b.** If AI assignment:
  - Verify AI capabilities match ticket type
  - Generate AI-specific context

**Postconditions**:
- Ticket has valid assignee
- Assignment is recorded in history
- Relevant parties are notified

### Status Transition Workflow

**Purpose**: Move ticket through its lifecycle states following workflow rules.

**Actors**: Assignee, Reviewer, Project Manager

**Preconditions**:
- Ticket exists
- User has permission for transition
- Target status is valid from current status

**Main Flow**:
```
1. User requests status change
2. System validates transition:
   - Check workflow rules
   - Verify user permissions
   - Validate business rules
3. For transition to 'in_progress':
   - Verify assignee set
   - Check dependencies completed
   - Ensure no other in_progress ticket
4. For transition to 'completed':
   - Verify all tasks completed
   - Check acceptance criteria met
   - Ensure implementation plan approved (if required)
5. System updates ticket status
6. System records transition:
   - Previous status
   - New status
   - Transitioned by
   - Transition timestamp
   - Reason (optional)
7. System updates parent epic progress
8. System emits TicketStatusChanged event
9. Return updated ticket
```

**State Transition Rules**:
```
pending → in_progress:
  - Must have assignee
  - Dependencies must be completed

in_progress → completed:
  - All tasks must be completed
  - Acceptance criteria must be met

completed → archived:
  - Only after configured archive period

any → pending:
  - Only for reopening
  - Clears completion data
```

**Alternative Flows**:
- **3a.** If blocked by dependencies:
  - List blocking tickets
  - Suggest resolution order
- **4a.** If criteria not met:
  - List unmet criteria
  - Provide completion checklist

**Postconditions**:
- Ticket in new valid status
- Transition recorded in history
- Related entities updated

## Epic Management Workflows

### Epic Creation Workflow

**Purpose**: Create an epic to group related tickets.

**Actors**: Project Manager, Product Owner

**Preconditions**:
- User has epic creation permissions
- Project exists and is active

**Main Flow**:
```
1. User initiates epic creation
2. User provides epic information:
   - Title (required)
   - Business value statement (required)
   - Success criteria (required)
   - Target date (optional)
3. System validates epic data
4. System generates unique epic ID
5. System creates epic in project
6. System emits EpicCreated event
7. Return created epic
```

**Postconditions**:
- Epic exists in project
- Epic ready for ticket assignment

### Epic Progress Tracking Workflow

**Purpose**: Calculate and update epic progress based on ticket statuses.

**Actors**: System (automated)

**Trigger**: Ticket status change within epic

**Main Flow**:
```
1. System detects ticket status change
2. System identifies parent epic
3. System retrieves all epic tickets
4. System calculates progress:
   - Count tickets by status
   - Calculate completion percentage
   - Determine status breakdown
5. System updates epic progress
6. If all tickets completed:
   - Update epic status to completed
   - Emit EpicCompleted event
7. If progress regression:
   - Update epic status appropriately
8. System notifies stakeholders of significant changes
```

**Progress Calculation**:
```
completion_percentage = (completed_tickets / total_tickets) * 100

epic_status =
  if all tickets completed: 'completed'
  else if any ticket in_progress: 'in_progress'
  else: 'planned'
```

**Postconditions**:
- Epic progress accurately reflects ticket states
- Stakeholders notified of progress changes

## Dependency Management Workflows

### Add Dependency Workflow

**Purpose**: Establish dependency relationships between tickets.

**Actors**: Developer, Project Manager

**Preconditions**:
- Both tickets exist in same project
- No circular dependency would be created
- User has permission to modify tickets

**Main Flow**:
```
1. User specifies dependency relationship:
   - Source ticket
   - Target ticket
   - Dependency type (blocks/depends_on)
2. System validates relationship:
   - Both tickets exist
   - No self-reference
   - No circular dependency
3. System checks for circular dependencies:
   - Build dependency graph
   - Detect cycles using DFS
4. System adds dependency to source ticket
5. System adds inverse relationship to target
6. System emits DependencyAdded event
7. System recalculates affected ticket availability
```

**Circular Dependency Detection**:
```
function hasCircularDependency(source, target):
  visited = new Set()
  return dfs(target, source, visited)

function dfs(current, target, visited):
  if current == target: return true
  if visited.has(current): return false
  visited.add(current)
  for each dependency of current:
    if dfs(dependency, target, visited): return true
  return false
```

**Postconditions**:
- Valid dependency relationship established
- No circular dependencies exist
- Execution order maintained

### Dependency Resolution Workflow

**Purpose**: Determine which tickets can be started based on dependencies.

**Actors**: System, AI Assistant

**Trigger**: Request for available tickets

**Main Flow**:
```
1. System retrieves all project tickets
2. For each pending ticket:
   - Retrieve dependencies
   - Check dependency statuses
   - Mark as available if all dependencies completed
3. System sorts available tickets by:
   - Priority (high to low)
   - Creation date (oldest first)
   - Dependency depth (fewer dependencies first)
4. System filters by additional criteria:
   - Assignee availability
   - Required skills/capabilities
5. Return ordered list of available tickets
```

**Postconditions**:
- Accurate list of workable tickets
- Proper execution order maintained

## Implementation Planning Workflows

### Create Implementation Plan Workflow

**Purpose**: Document technical approach before implementation.

**Actors**: Developer, AI Assistant

**Preconditions**:
- Ticket exists and is assigned
- Project requires implementation plans

**Main Flow**:
```
1. Assignee creates implementation plan
2. Plan includes:
   - Problem statement
   - Proposed solution
   - Technical approach
   - Alternative solutions
   - Trade-off analysis
3. System validates plan completeness
4. System attaches plan to ticket
5. System sets plan status to 'draft'
6. If auto-review enabled:
   - Submit for AI validation
7. Return plan for review
```

**Postconditions**:
- Plan attached to ticket
- Ready for review process

### Implementation Plan Review Workflow

**Purpose**: Review and approve implementation plans before coding.

**Actors**: Senior Developer, AI Expert, Technical Lead

**Preconditions**:
- Implementation plan exists
- Plan submitted for review

**Main Flow**:
```
1. System notifies reviewers
2. Reviewers analyze plan:
   - Technical feasibility
   - Architecture alignment
   - Best practices compliance
   - Security considerations
3. Reviewers provide feedback:
   - Approval
   - Conditional approval
   - Request changes
   - Rejection
4. System aggregates reviews
5. If all approve:
   - Mark plan as approved
   - Allow ticket to progress
6. If changes requested:
   - Notify assignee
   - Document required changes
   - Reset to draft status
7. System records review history
8. System emits PlanReviewed event
```

**Review Criteria**:
- Technical correctness
- Performance implications
- Security considerations
- Maintainability
- Alignment with architecture

**Postconditions**:
- Plan has clear review status
- Feedback documented
- Ticket can progress if approved

## Collaboration Workflows

### Add Comment Workflow

**Purpose**: Add discussion or context to tickets.

**Actors**: All project contributors

**Preconditions**:
- Ticket exists
- User has comment permission

**Main Flow**:
```
1. User writes comment content (markdown)
2. System processes comment:
   - Parse markdown
   - Extract mentions (@user)
   - Detect references (#ticket)
3. System validates content:
   - Not empty
   - Within size limits
   - Valid markdown
4. System creates comment:
   - Generate ID
   - Set author
   - Record timestamp
   - Process mentions
5. System notifies mentioned users
6. System updates ticket activity
7. System emits CommentAdded event
8. Return created comment
```

**Postconditions**:
- Comment added to ticket
- Mentioned users notified
- Activity timeline updated

### Task Management Workflow

**Purpose**: Manage granular work items within tickets.

**Actors**: Assignee, Contributors

**Preconditions**:
- Ticket exists
- User has task management permission

**Main Flow for Task Creation**:
```
1. User adds task description
2. System creates task:
   - Generate task ID
   - Set initial status (pending)
   - Assign position
3. System updates ticket task list
4. Return created task
```

**Main Flow for Task Completion**:
```
1. User marks task as complete
2. System validates:
   - Task exists
   - Not already completed
3. System updates task:
   - Set status to completed
   - Record completer
   - Set completion timestamp
4. System checks if all tasks completed:
   - Update ticket readiness
   - Notify assignee
5. Return updated task
```

**Postconditions**:
- Task list accurately reflects work
- Progress tracked at granular level

## Integration Workflows

### Mark for External Sync Workflow

**Purpose**: Prepare ticket for synchronization with external systems.

**Actors**: Project Manager, Developer

**Preconditions**:
- Ticket exists
- Project has sync enabled
- User has sync permissions

**Main Flow**:
```
1. User marks ticket for sync
2. System validates sync eligibility:
   - Check privacy level
   - Verify sync configuration
   - Validate required fields
3. System prepares sync metadata:
   - Set privacy to 'shareable'
   - Generate external reference
   - Map fields to external format
4. System queues for sync
5. System emits TicketMarkedForSync event
6. Return updated ticket
```

**Postconditions**:
- Ticket ready for external sync
- Privacy settings updated
- Sync queue updated

## Error Handling Patterns

### Validation Errors
- Return specific field-level errors
- Provide correction suggestions
- Maintain form state for retry

### Permission Errors
- Clear permission requirement messaging
- Suggest alternative actions
- Log permission attempts

### Concurrency Errors
- Implement optimistic locking
- Provide merge assistance
- Show conflicting changes

### Integration Errors
- Graceful degradation
- Queue for retry
- Maintain local functionality

## Performance Considerations

### Workflow Optimization
- Batch related operations
- Async processing for non-critical paths
- Cache frequently accessed data
- Minimize database roundtrips

### Event Processing
- Async event publishing
- Event batching for high volume
- Priority queues for critical events
- Dead letter handling

## Related Documentation

- [Domain Model](./DOMAIN_MODEL.md) - Entity specifications
- [Context Overview](./README.md) - High-level context description
- [Constraints](./CONSTRAINTS.md) - Non-functional requirements
- [Context Map](../../architecture/CONTEXT_MAP.md) - Integration patterns
