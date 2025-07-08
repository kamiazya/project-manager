# Technical Data Model

This document describes the physical data storage and technical implementation details for the Project Manager system. While the domain models describe the business concepts, this document focuses on how data is actually persisted and accessed.

## Overview

The Project Manager uses a hybrid storage approach:
- **Primary Storage**: JSON files for flexibility and portability
- **Index Storage**: Lightweight indexes for performance
- **Cache Layer**: In-memory caching for hot data
- **Event Store**: Append-only log for audit trail

## Storage Architecture

```
project-root/
├── .pm/                          # Project Manager data
│   ├── config.json              # Global configuration
│   ├── projects/                # Project data
│   │   ├── {project-id}/       # Individual project
│   │   │   ├── project.json   # Project metadata
│   │   │   ├── tickets.json   # Ticket collection
│   │   │   ├── epics.json     # Epic collection
│   │   │   ├── users.json     # Project users
│   │   │   └── events.jsonl   # Event log (append-only)
│   │   └── index.json          # Cross-project index
│   ├── ai/                      # AI Integration data
│   │   ├── sessions/           # AI session data
│   │   ├── contexts/           # Cached contexts
│   │   └── validations/        # Validation results
│   └── sync/                    # External sync data
│       ├── mappings/           # Entity mappings
│       └── cache/              # External data cache
```

## Data Schemas

### Project Storage Schema

```typescript
// project.json
{
  "version": "1.0.0",
  "id": "proj_1234567890",
  "name": "Project Manager",
  "description": "Local-first ticket management",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "config": {
    "privacy_level": "shareable",
    "sync_enabled": true,
    "default_workflow": "standard",
    "auto_archive_days": 90
  },
  "statistics": {
    "total_tickets": 150,
    "active_tickets": 45,
    "total_epics": 12,
    "contributors": 5
  }
}
```

### Ticket Storage Schema

```typescript
// tickets.json (array of tickets)
[
  {
    "id": "tkt_1234567890",
    "project_id": "proj_1234567890",
    "number": 123, // Human-friendly number
    "title": "Implement user authentication",
    "description": "...",
    "type": "feature",
    "status": "in_progress",
    "priority": "high",
    "privacy_level": "shareable",
    
    // Relationships
    "epic_id": "epic_1234567890",
    "parent_id": null,
    "dependencies": [
      {"ticket_id": "tkt_0987654321", "type": "depends_on"}
    ],
    
    // Assignment
    "assignee_id": "user_1234567890",
    "reviewer_ids": ["user_0987654321"],
    
    // Content
    "implementation_plan_id": "plan_1234567890",
    "acceptance_criteria": [
      {
        "id": "ac_001",
        "description": "User can log in with email/password",
        "is_met": false
      }
    ],
    
    // Metadata
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-02T00:00:00Z",
    "created_by": "user_1234567890",
    
    // Denormalized data for performance
    "task_count": 5,
    "completed_task_count": 2,
    "comment_count": 12,
    "last_activity": "2024-01-02T00:00:00Z"
  }
]
```

### Epic Storage Schema

```typescript
// epics.json
[
  {
    "id": "epic_1234567890",
    "project_id": "proj_1234567890",
    "title": "User Authentication System",
    "description": "Complete auth implementation",
    "business_value": "Enable secure user access",
    "status": "in_progress",
    "target_date": "2024-03-01T00:00:00Z",
    "success_criteria": [
      "Users can register and log in",
      "Sessions are secure",
      "Password reset works"
    ],
    
    // Denormalized progress data
    "statistics": {
      "total_tickets": 15,
      "completed_tickets": 5,
      "in_progress_tickets": 3,
      "pending_tickets": 7,
      "completion_percentage": 33
    },
    
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-02T00:00:00Z"
  }
]
```

### Event Log Schema

```typescript
// events.jsonl (newline-delimited JSON)
{"timestamp":"2024-01-01T00:00:00Z","type":"ticket_created","actor":"user_123","data":{"ticket_id":"tkt_123","title":"..."}}
{"timestamp":"2024-01-01T00:01:00Z","type":"ticket_updated","actor":"user_123","data":{"ticket_id":"tkt_123","changes":{"status":{"from":"pending","to":"in_progress"}}}}
{"timestamp":"2024-01-01T00:02:00Z","type":"comment_added","actor":"ai_assistant_1","data":{"ticket_id":"tkt_123","comment_id":"cmt_456"}}
```

## Indexing Strategy

### Primary Indexes

```typescript
// index.json
{
  "version": "1.0.0",
  "projects": {
    "by_name": {
      "project-manager": "proj_1234567890"
    }
  },
  "tickets": {
    "by_number": {
      "proj_1234567890": {
        "123": "tkt_1234567890"
      }
    },
    "by_status": {
      "in_progress": ["tkt_1234567890", "tkt_0987654321"]
    },
    "by_assignee": {
      "user_1234567890": ["tkt_1234567890"]
    }
  },
  "search": {
    "last_indexed": "2024-01-02T00:00:00Z",
    "document_count": 150
  }
}
```

### Search Index

For full-text search, we maintain a separate inverted index:

```typescript
// search_index.json
{
  "terms": {
    "authentication": {
      "tickets": ["tkt_123", "tkt_124"],
      "epics": ["epic_12"]
    },
    "user": {
      "tickets": ["tkt_123", "tkt_125", "tkt_126"],
      "epics": ["epic_12", "epic_13"]
    }
  },
  "metadata": {
    "indexed_at": "2024-01-02T00:00:00Z",
    "term_count": 1500,
    "document_count": 150
  }
}
```

## Caching Strategy

### In-Memory Cache Structure

```typescript
interface CacheLayer {
  // Hot data - frequently accessed
  projects: LRUCache<ProjectId, Project>;
  tickets: LRUCache<TicketId, Ticket>;
  
  // Computed data
  epicProgress: TTLCache<EpicId, Progress>;
  dependencyGraphs: TTLCache<ProjectId, DependencyGraph>;
  
  // AI contexts
  aiContexts: TTLCache<SessionId, AIContext>;
}
```

### Cache Policies

| Cache Type | Size Limit | TTL | Eviction |
|------------|------------|-----|----------|
| Projects | 100 entries | No TTL | LRU |
| Tickets | 1000 entries | No TTL | LRU |
| Epic Progress | 200 entries | 5 minutes | TTL + LRU |
| Dependency Graphs | 50 entries | 10 minutes | TTL + LRU |
| AI Contexts | 20 entries | 30 minutes | TTL + LRU |

## Performance Optimizations

### Denormalization Strategy

To avoid expensive joins and calculations:

1. **Ticket Counters**: Store task_count, comment_count directly
2. **Epic Statistics**: Pre-calculate progress percentages
3. **Last Activity**: Track for efficient sorting
4. **User Assignments**: Denormalize current assignments

### Lazy Loading Patterns

```typescript
interface LazyLoadable<T> {
  id: string;
  // Core fields always loaded
  title: string;
  status: string;
  // Large fields loaded on demand
  _lazy?: {
    description?: string;
    comments?: Comment[];
    history?: Event[];
  };
}
```

### Batch Operations

For bulk updates, we use transaction logs:

```typescript
// transaction.json (temporary file)
{
  "transaction_id": "txn_123",
  "started_at": "2024-01-01T00:00:00Z",
  "operations": [
    {"op": "update", "entity": "ticket", "id": "tkt_123", "data": {...}},
    {"op": "update", "entity": "ticket", "id": "tkt_124", "data": {...}}
  ]
}
```

## Migration Strategy

### Version Management

Each data file includes version information:

```typescript
{
  "version": "1.0.0",
  "_migration": {
    "from_version": "0.9.0",
    "migrated_at": "2024-01-01T00:00:00Z",
    "migration_id": "mig_123"
  }
}
```

### Migration Scripts

```
migrations/
├── 0.9.0-to-1.0.0.js
├── 1.0.0-to-1.1.0.js
└── rollback/
    ├── 1.0.0-to-0.9.0.js
    └── 1.1.0-to-1.0.0.js
```

## Backup and Recovery

### Backup Strategy

1. **Incremental Backups**: Event log enables point-in-time recovery
2. **Snapshot Backups**: Full state snapshots daily
3. **Offsite Sync**: Optional cloud backup

### Recovery Procedures

```typescript
interface RecoveryPoint {
  timestamp: Date;
  type: 'snapshot' | 'incremental';
  location: string;
  size: number;
  checksum: string;
}
```

## Security Considerations

### Encryption

Optional encryption for sensitive data:

```typescript
// encrypted_fields.json
{
  "encryption_version": "1",
  "algorithm": "AES-256-GCM",
  "fields": {
    "tickets.*.description": "encrypted_base64...",
    "comments.*.content": "encrypted_base64..."
  }
}
```

### Access Control

File-system based permissions:
- Read-only for backup files
- Write protection for event logs
- User-specific permission files

## Integration Points

### External System Caching

```typescript
// sync/cache/github_issues.json
{
  "last_sync": "2024-01-01T00:00:00Z",
  "entities": {
    "issues/123": {
      "external_id": "123",
      "external_data": {...},
      "cached_at": "2024-01-01T00:00:00Z",
      "ttl": 300
    }
  }
}
```

### AI Context Storage

```typescript
// ai/contexts/session_123.json
{
  "session_id": "session_123",
  "created_at": "2024-01-01T00:00:00Z",
  "context": {
    "project_summary": "...",
    "active_tickets": [...],
    "recent_decisions": [...],
    "relevant_history": [...]
  },
  "size_bytes": 15360,
  "compression": "gzip"
}
```

## Monitoring and Maintenance

### Health Metrics

```typescript
// .pm/health.json
{
  "last_check": "2024-01-01T00:00:00Z",
  "storage": {
    "total_size_mb": 125,
    "file_count": 1523,
    "largest_file": "events.jsonl",
    "fragmentation": 0.15
  },
  "performance": {
    "avg_read_ms": 12,
    "avg_write_ms": 25,
    "cache_hit_rate": 0.85
  }
}
```

### Maintenance Tasks

1. **Compaction**: Rewrite fragmented files
2. **Archival**: Move old data to archive storage
3. **Index Rebuild**: Periodic full reindex
4. **Cache Warm-up**: Pre-load hot data

## Concurrency Control

### Lock Mechanism

Item-level locking using filesystem-based lock files:

```
.pm/locks/
├── issues/
│   └── issue-001.lock.user123.1704110400
├── epics/
│   └── epic-001.lock.ai-agent.1704114000
└── projects/
    └── project.lock.user456.1704117600
```

Lock file naming convention:
- `{item-id}.lock.{locked-by}.{unix-timestamp}`
- Lock presence indicates active lock
- Expired locks are automatically cleaned up based on timestamp

## Related Documentation

- [Domain Models](../../contexts/ticket_management/DOMAIN_MODEL.md) - Business concept definitions
- [Architecture](./ARCHITECTURE.md) - System architecture
- [Context Map](./CONTEXT_MAP.md) - Bounded context boundaries
- [Constraints](../../contexts/ticket_management/CONSTRAINTS.md) - Performance requirements