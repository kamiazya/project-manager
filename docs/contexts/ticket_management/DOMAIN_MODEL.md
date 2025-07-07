# Ticket Management Domain Model

This document provides detailed specifications for all entities, aggregates, value objects, and domain services within the Ticket Management bounded context.

## Aggregates

### Project (Aggregate Root)

The top-level container for all development work, serving as the boundary for consistency and the entry point for the bounded context.

```typescript
interface Project {
  // Identity
  id: ProjectId;
  
  // Attributes
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Configuration
  config: ProjectConfiguration;
  
  // Collections
  tickets: Ticket[];
  epics: Epic[];
  contributors: ProjectContributor[];
  milestones: Milestone[];
  
  // Behaviors
  createTicket(data: TicketData): Ticket;
  createEpic(data: EpicData): Epic;
  addContributor(user: User, role: ProjectRole): void;
  updateConfiguration(config: ProjectConfiguration): void;
  archive(): void;
}
```

#### Project Configuration
```typescript
interface ProjectConfiguration {
  // Workflow
  defaultWorkflow: WorkflowType;
  customStatuses: Status[];
  
  // Permissions
  permissions: PermissionSet;
  
  // Integration
  syncEnabled: boolean;
  privacyLevel: PrivacyLevel;
  
  // Preferences
  defaultPriority: Priority;
  requireImplementationPlan: boolean;
  autoArchiveDays: number;
}
```

### Ticket

The fundamental unit of work representing a discrete development task.

```typescript
interface Ticket {
  // Identity
  id: TicketId;
  projectId: ProjectId;
  
  // Metadata
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: UserId;
  
  // Classification
  type: TicketType;
  status: Status;
  priority: Priority;
  privacyLevel: PrivacyLevel;
  
  // Relationships
  epicId?: EpicId;
  parentId?: TicketId; // For sub-issues
  dependencies: TicketDependency[];
  
  // Assignment
  assignee?: UserId;
  reviewers: UserId[];
  
  // Content
  implementationPlan?: ImplementationPlan;
  acceptanceCriteria: AcceptanceCriterion[];
  tasks: Task[];
  comments: Comment[];
  
  // Tracking
  stateHistory: StateTransition[];
  contributions: Contribution[];
  
  // Behaviors
  assign(userId: UserId): void;
  updateStatus(status: Status, reason: string): void;
  addTask(description: string): Task;
  addComment(author: UserId, content: string): Comment;
  attachImplementationPlan(plan: ImplementationPlan): void;
  addDependency(ticketId: TicketId, type: DependencyType): void;
  canTransitionTo(status: Status): boolean;
}
```

### Epic

A collection of related tickets forming a larger initiative.

```typescript
interface Epic {
  // Identity
  id: EpicId;
  projectId: ProjectId;
  
  // Metadata
  title: string;
  description: string;
  businessValue: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Planning
  targetDate?: Date;
  successCriteria: string[];
  
  // Relationships
  ticketIds: TicketId[];
  milestoneId?: MilestoneId;
  
  // Progress
  status: EpicStatus;
  progress: Progress;
  
  // Behaviors
  addTicket(ticketId: TicketId): void;
  removeTicket(ticketId: TicketId): void;
  calculateProgress(): Progress;
  updateStatus(): void;
}
```

## Entities

### User

Represents human participants in the development process.

```typescript
interface User {
  // Identity
  id: UserId;
  
  // Profile
  name: string;
  email: string;
  avatarUrl?: string;
  
  // Preferences
  timezone: string;
  language: string;
  notificationPreferences: NotificationPreferences;
  
  // System
  createdAt: Date;
  lastActiveAt: Date;
  isActive: boolean;
}
```

### Implementation Plan

Technical approach documentation for tickets.

```typescript
interface ImplementationPlan {
  // Identity
  id: ImplementationPlanId;
  ticketId: TicketId;
  
  // Content
  problemStatement: string;
  proposedSolution: string;
  technicalApproach: string;
  alternatives: Alternative[];
  
  // Review
  status: ReviewStatus;
  reviews: Review[];
  approvedBy?: UserId;
  approvedAt?: Date;
  
  // Metadata
  createdBy: UserId;
  createdAt: Date;
  updatedAt: Date;
  
  // Behaviors
  submit(): void;
  approve(userId: UserId): void;
  requestChanges(review: Review): void;
}
```

### Task

Actionable items within a ticket.

```typescript
interface Task {
  // Identity
  id: TaskId;
  ticketId: TicketId;
  
  // Content
  description: string;
  status: TaskStatus;
  
  // Assignment
  assignee?: UserId;
  
  // Tracking
  createdAt: Date;
  completedAt?: Date;
  completedBy?: UserId;
  
  // Order
  position: number;
  
  // Behaviors
  complete(userId: UserId): void;
  reopen(): void;
  assign(userId: UserId): void;
}
```

### Comment

Discussion threads on tickets.

```typescript
interface Comment {
  // Identity
  id: CommentId;
  ticketId: TicketId;
  parentId?: CommentId; // For threading
  
  // Content
  content: string; // Markdown
  
  // Metadata
  author: UserId;
  createdAt: Date;
  updatedAt?: Date;
  editHistory: Edit[];
  
  // Visibility
  visibility: CommentVisibility;
  
  // Engagement
  mentions: UserId[];
  reactions: Reaction[];
  
  // Behaviors
  edit(content: string): void;
  delete(): void;
  addReaction(userId: UserId, type: ReactionType): void;
}
```

### Milestone

Significant points in the project timeline.

```typescript
interface Milestone {
  // Identity
  id: MilestoneId;
  projectId: ProjectId;
  
  // Planning
  title: string;
  description: string;
  targetDate: Date;
  
  // Relationships
  epicIds: EpicId[];
  ticketIds: TicketId[];
  
  // Progress
  status: MilestoneStatus;
  progress: Progress;
  
  // Behaviors
  addEpic(epicId: EpicId): void;
  addTicket(ticketId: TicketId): void;
  calculateProgress(): Progress;
}
```

## Value Objects

### Status
```typescript
type Status = 'pending' | 'in_progress' | 'completed' | 'archived';

interface StateTransition {
  from: Status;
  to: Status;
  transitionedBy: UserId;
  transitionedAt: Date;
  reason?: string;
}
```

### Priority
```typescript
type Priority = 'high' | 'medium' | 'low';
```

### TicketType
```typescript
type TicketType = 'feature' | 'bug' | 'task' | 'research' | 'design' | 'chore';
```

### PrivacyLevel
```typescript
type PrivacyLevel = 'local_only' | 'shareable' | 'public';
```

### Dependency
```typescript
interface TicketDependency {
  ticketId: TicketId;
  type: DependencyType;
}

type DependencyType = 'blocks' | 'depends_on' | 'related_to';
```

### Progress
```typescript
interface Progress {
  completed: number;
  total: number;
  percentage: number;
  
  // Breakdown by status
  statusBreakdown: {
    pending: number;
    in_progress: number;
    completed: number;
    archived: number;
  };
}
```

### Contribution
```typescript
interface Contribution {
  contributorId: UserId;
  type: ContributionType;
  timestamp: Date;
  details: any; // Type-specific data
}

type ContributionType = 
  | 'created' 
  | 'updated' 
  | 'status_changed' 
  | 'assigned' 
  | 'commented' 
  | 'completed';
```

### AcceptanceCriterion
```typescript
interface AcceptanceCriterion {
  description: string;
  isMet: boolean;
  verifiedBy?: UserId;
  verifiedAt?: Date;
}
```

## Domain Services

### TicketAssignmentService
Manages ticket assignment rules and constraints.

```typescript
interface TicketAssignmentService {
  canAssign(ticket: Ticket, user: User): boolean;
  assign(ticket: Ticket, user: User): void;
  findAvailableAssignees(project: Project): User[];
  getActiveTicketForUser(userId: UserId, projectId: ProjectId): Ticket | null;
}
```

### DependencyResolver
Resolves and validates ticket dependencies.

```typescript
interface DependencyResolver {
  canStartTicket(ticket: Ticket): boolean;
  getBlockingTickets(ticket: Ticket): Ticket[];
  detectCircularDependency(ticket: Ticket, dependency: TicketId): boolean;
  getExecutionOrder(tickets: Ticket[]): Ticket[];
}
```

### ProgressCalculator
Calculates progress for epics and milestones.

```typescript
interface ProgressCalculator {
  calculateEpicProgress(epic: Epic, tickets: Ticket[]): Progress;
  calculateMilestoneProgress(milestone: Milestone, epics: Epic[], tickets: Ticket[]): Progress;
  getCompletionEstimate(progress: Progress, velocity: number): Date;
}
```

### WorkflowEngine
Manages status transitions and workflow rules.

```typescript
interface WorkflowEngine {
  getAvailableTransitions(ticket: Ticket): Status[];
  validateTransition(ticket: Ticket, newStatus: Status): ValidationResult;
  executeTransition(ticket: Ticket, newStatus: Status, userId: UserId): void;
  getWorkflowRules(projectId: ProjectId): WorkflowRule[];
}
```

## Repositories

### ProjectRepository
```typescript
interface ProjectRepository {
  findById(id: ProjectId): Promise<Project | null>;
  findByName(name: string): Promise<Project | null>;
  save(project: Project): Promise<void>;
  delete(id: ProjectId): Promise<void>;
  list(filter?: ProjectFilter): Promise<Project[]>;
}
```

### TicketRepository
```typescript
interface TicketRepository {
  findById(id: TicketId): Promise<Ticket | null>;
  findByProject(projectId: ProjectId): Promise<Ticket[]>;
  findByEpic(epicId: EpicId): Promise<Ticket[]>;
  findByAssignee(userId: UserId): Promise<Ticket[]>;
  save(ticket: Ticket): Promise<void>;
  delete(id: TicketId): Promise<void>;
  search(criteria: SearchCriteria): Promise<Ticket[]>;
}
```

## Domain Events

### Project Events
- `ProjectCreated`
- `ProjectConfigured`
- `ProjectArchived`
- `ContributorAdded`
- `ContributorRemoved`

### Ticket Events
- `TicketCreated`
- `TicketUpdated`
- `TicketAssigned`
- `TicketStatusChanged`
- `TicketCompleted`
- `TicketArchived`
- `DependencyAdded`
- `ImplementationPlanAttached`

### Epic Events
- `EpicCreated`
- `EpicUpdated`
- `EpicCompleted`
- `TicketAddedToEpic`
- `TicketRemovedFromEpic`

### Collaboration Events
- `CommentAdded`
- `TaskCompleted`
- `ReviewSubmitted`
- `PlanApproved`

## Invariants

### Project Invariants
- A project must have at least one administrator
- Project names must be unique within the system
- Archived projects cannot be modified

### Ticket Invariants
- Only one ticket per assignee can be in_progress
- Tickets cannot depend on themselves
- Completed tickets cannot transition to pending
- All dependencies must be completed before a ticket can complete

### Epic Invariants
- An epic cannot be completed if it contains incomplete tickets
- Epics must belong to the same project as their tickets
- Epic progress must accurately reflect ticket statuses

### Task Invariants
- Tasks belong to exactly one ticket
- Completed tasks cannot be deleted, only reopened
- Task position must be unique within a ticket

## Related Documentation

- [Context Overview](./README.md) - High-level context description
- [Workflows](./WORKFLOWS.md) - Detailed business processes
- [Constraints](./CONSTRAINTS.md) - Non-functional requirements
- [Ubiquitous Language](../../domain/UBIQUITOUS_LANGUAGE.md) - Domain terminology