# External Sync Context

## Overview

The External Sync context handles bidirectional synchronization between the Project Manager system and external project management tools such as GitHub Issues, Jira, Linear, and others. It manages data mapping, conflict resolution, and privacy-aware selective sharing.

## Context Responsibilities

### Primary Responsibilities
- External system authentication and connection management
- Bidirectional data synchronization
- Data format translation and mapping
- Conflict detection and resolution
- Privacy and access control enforcement
- Sync status monitoring and reporting
- Rate limiting and API quota management

### Key Business Rules
- Only tickets marked as `shareable` or `public` can be synchronized
- External changes never override local changes without user confirmation
- Each external system maintains its own mapping configuration
- Sync operations must be idempotent
- Failed syncs must not corrupt local data

## Domain Model Overview

### Core Aggregates

#### External Project (Aggregate Root)
Representation of a project in an external system.

**Key Responsibilities**:
- Maintain connection configuration
- Track sync preferences
- Store field mappings
- Monitor sync health

#### Sync Mapping
Bidirectional mapping between internal and external entities.

**Key Responsibilities**:
- Translate entity formats
- Track entity relationships
- Maintain sync history
- Handle mapping conflicts

#### Sync Session
A bounded synchronization operation.

**Key Responsibilities**:
- Execute sync operations
- Track changes made
- Handle errors gracefully
- Generate sync reports

### Key Entities

#### External Ticket
External system's representation of our tickets.

**Components**:
- External ID
- External fields
- Last sync timestamp
- Sync status
- Conflict markers

#### Sync Configuration
Per-project sync settings.

**Components**:
- External system type
- Authentication credentials
- Field mappings
- Sync frequency
- Privacy rules

#### Conflict
Detected discrepancy between local and external data.

**Components**:
- Conflict type
- Local value
- External value
- Detection timestamp
- Resolution strategy

### Value Objects

#### Sync Status
- `active`: Sync is operational
- `paused`: Temporarily disabled
- `error`: Sync failing
- `configuring`: Initial setup
- `disconnected`: No connection

#### Sync Direction
- `push`: Local → External
- `pull`: External → Local
- `bidirectional`: Both directions
- `disabled`: No sync

#### Conflict Resolution Strategy
- `local_wins`: Always keep local changes
- `external_wins`: Always accept external changes
- `newest_wins`: Keep most recent change
- `manual`: Require user intervention
- `merge`: Attempt automatic merge

#### Privacy Level
- `local_only`: Never sync
- `shareable`: Can sync with permission
- `public`: Always sync

## Key Workflows

### Initial Sync Setup Workflow
1. Select external system type
2. Authenticate with external system
3. Select project for synchronization
4. Configure field mappings
5. Set privacy preferences
6. Perform initial sync
7. Verify sync results

### Incremental Sync Workflow
1. Check sync schedule
2. Authenticate with external system
3. Fetch changes since last sync
4. Detect conflicts
5. Apply resolution strategies
6. Push local changes
7. Update sync status
8. Generate sync report

### Conflict Resolution Workflow
1. Identify conflict type
2. Apply configured strategy
3. If manual resolution needed:
   - Present conflict to user
   - Capture resolution decision
   - Apply resolution
4. Log resolution outcome
5. Update sync mapping

### Field Mapping Workflow
1. Analyze external system schema
2. Identify compatible fields
3. Create mapping rules
4. Handle custom fields
5. Validate mapping completeness
6. Test with sample data

## Integration Points

### Inbound Integrations
- **From Ticket Management Context**:
  - Tickets marked for external sharing
  - Project configuration updates
  - Privacy preference changes
  - Manual sync triggers

### Outbound Integrations
- **To Ticket Management Context**:
  - External ticket updates
  - New tickets from external systems
  - Conflict notifications
  - Sync status updates

### External System APIs
- **GitHub Issues API**
- **Jira REST API**
- **Linear GraphQL API**
- **Generic webhook support**

### Events Published
- `SyncStarted`
- `SyncCompleted`
- `ConflictDetected`
- `ConflictResolved`
- `ExternalTicketCreated`
- `ExternalTicketUpdated`
- `SyncError`

### Events Consumed
- `TicketCreated` (from Ticket Management)
- `TicketUpdated` (from Ticket Management)
- `ProjectConfigured` (from Ticket Management)

## Integration Patterns

### Anti-Corruption Layer
Protects internal domain model from external system variations:
- **Data Transformation**: Convert between internal and external formats
- **Field Mapping**: Flexible mapping configuration
- **Type Safety**: Validate external data
- **Error Isolation**: Prevent external errors from affecting core system

### Sync Strategies

#### Polling Strategy
```
1. Set sync interval (e.g., 5 minutes)
2. Check for changes on schedule
3. Batch process updates
4. Handle rate limits gracefully
```

#### Webhook Strategy
```
1. Register webhooks with external system
2. Receive real-time notifications
3. Process events immediately
4. Maintain webhook health
```

#### Hybrid Strategy
```
1. Use webhooks for real-time updates
2. Periodic polling for missed events
3. Reconciliation on schedule
4. Best of both approaches
```

## Data Storage

### Persistence Strategy
- Sync mappings in dedicated storage
- External data cache for performance
- Sync history for audit trail
- Conflict queue for resolution

### Caching Strategy
- Cache external data to reduce API calls
- Invalidate cache on sync
- Respect external system rate limits
- Implement exponential backoff

## External System Adapters

### GitHub Issues Adapter
- **Authentication**: OAuth or Personal Access Token
- **Capabilities**: Issues, Labels, Milestones, Comments
- **Limitations**: Rate limiting (5000/hour authenticated)
- **Special Features**: Markdown support, Reactions

### Jira Adapter
- **Authentication**: OAuth 2.0 or API Token
- **Capabilities**: Issues, Epics, Sprints, Custom Fields
- **Limitations**: Complex permission model
- **Special Features**: JQL queries, Workflows

### Linear Adapter
- **Authentication**: API Key
- **Capabilities**: Issues, Projects, Cycles, Labels
- **Limitations**: GraphQL complexity limits
- **Special Features**: Real-time subscriptions

## Non-Functional Requirements

### Performance
- Sync latency: < 30 seconds for incremental sync
- Batch processing: Support 1000+ tickets
- API efficiency: Minimize external API calls
- Cache hit rate: > 80% for read operations

### Reliability
- Retry failed syncs with exponential backoff
- Graceful degradation on external system failure
- Data consistency guarantees
- Rollback capability for failed syncs

### Security
- Secure credential storage
- OAuth token refresh automation
- API key rotation support
- Audit trail for all sync operations
- Data sanitization for external systems

## Team Ownership

**Responsible Team**: Integration Specialists

**Key Responsibilities**:
- External API integration
- Adapter development and maintenance
- Sync algorithm optimization
- Conflict resolution strategies

## Future Considerations

### Planned Enhancements
- Additional external system adapters
- Advanced conflict resolution UI
- Sync performance optimization
- Real-time collaboration features
- Custom field mapping UI

### Potential Challenges
- Managing diverse external APIs
- Handling API version changes
- Scaling to large projects
- Complex permission models
- Rate limit optimization

## Related Documentation

- [Domain Model Details](./DOMAIN_MODEL.md) - Complete entity specifications
- [Workflows](./WORKFLOWS.md) - Detailed workflow documentation
- [Constraints](./CONSTRAINTS.md) - Non-functional requirements
- [Context Map](../../architecture/CONTEXT_MAP.md) - Integration patterns
- [External API Specifications](./API_SPECIFICATIONS.md) - External system details