# Dogfooding Workflow Guide

> **Note**: This document provides practical steps for using project-manager to manage its own development through dogfooding testing.

## Overview

This guide demonstrates how to use project-manager to track its own development work, validating the system through real-world usage patterns.

## Setup

### 1. Load Development Aliases

Before starting dogfooding, load the development aliases for efficient CLI usage:

```bash
source pm-dev-alias.sh
```

This provides convenient shortcuts for common operations:

- `pm-new` - Create new ticket
- `pm-todo` - List pending tickets  
- `pm-wip` - List work-in-progress
- `pm-all` - List all tickets
- `pm-start` - Start working on ticket
- `pm-done` - Mark ticket as done

## Basic Dogfooding Workflow

### 2. Create Development Tickets

Track actual development work as tickets:

```bash
# Create a new feature ticket (use direct command for reliability)
pnpm pm new "Implement user authentication" -d "Add login/logout functionality" -p h

# Create a bug fix ticket
pnpm pm new "Fix CLI command validation" -d "Commands should validate input parameters" -p m

# Create a documentation ticket
pnpm pm new "Update README with installation steps" -d "Add clear setup instructions" -p l
```

**Note**: Development aliases may not persist in all environments. Use `pnpm pm` directly for consistent results.

### 3. Check Your Work Queue

View pending and active work:

```bash
# List pending tickets
pnpm pm todo

# List work in progress
pnpm pm wip

# List all tickets
pnpm pm all
```

### 4. Start Working on a Ticket

Begin work on a specific ticket:

```bash
# Start working on ticket (replace with actual ticket ID)
pnpm pm start 1751764474

# This marks the ticket as 'in_progress'
```

### 5. Complete Tickets

Mark tickets as done when work is finished:

```bash
# Complete a ticket (replace with actual ticket ID)
pnpm pm done 1751764474

# This marks the ticket as 'completed'
```

## Advanced Dogfooding Patterns

### Epic and Feature Management

For larger development initiatives, create epics and features:

```bash
# Create an epic for major feature development
pnpm pm new "Authentication System Overhaul" -d "Complete redesign of user authentication" -p h --type epic

# Create feature tickets under the epic
pnpm pm new "OAuth 2.0 Integration" -d "Implement OAuth providers" -p h --type feature --parent <epic-id>
pnpm pm new "Password Reset Flow" -d "Add password reset functionality" -p m --type feature --parent <epic-id>
```

### Cross-cutting Feature Testing

Test comments, attachments, and labels through actual use:

```bash
# Add labels to categorize tickets
pnpm pm new "API Rate Limiting" -d "Implement rate limiting" -p h --labels backend,security

# Add progress updates through new tickets
pnpm pm new "Progress on #<ticket-id>: Started implementation" -d "Started implementation, researching best practices" -p l --type task

# File attachments (attach command not yet implemented)
# Note: File attachment functionality is planned but not yet available
```

### Relationship Management

Use ticket relationships for dependency tracking:

```bash
# Create dependent tickets
pnpm pm new "Database Schema Design" -d "Design user tables" -p h
pnpm pm new "API Endpoints" -d "Create auth endpoints" -p h --depends-on <schema-ticket-id>
```

## Validation Through Real Use

### Daily Development Routine

1. **Morning Planning**

   ```bash
   # Check work queue
   pnpm pm todo
   pnpm pm wip
   
   # Start work on priority ticket
   pnpm pm start <ticket-id>
   ```

2. **During Development**

   ```bash
   # Add progress updates through new tickets
   pnpm pm new "Progress on #<ticket-id>: Login endpoint implemented" -d "Implemented login endpoint, testing validation" -p l --type task
   
   # Create new tickets for discovered issues
   pnpm pm new "Fix validation error messages" -d "Error messages not user-friendly" -p m
   ```

3. **End of Day**

   ```bash
   # Complete finished work
   pnpm pm done <ticket-id>
   
   # Review tomorrow's queue
   pnpm pm todo
   ```

### Feature Validation

Test new features by actually using them:

```bash
# Test search functionality
pnpm pm search "authentication"

# Test filtering
pnpm pm list --status in_progress --priority high

# Test bulk operations
pnpm pm bulk-update --status completed --ids 123,456,789
```

## Performance and Usability Testing

### Load Testing

Create realistic data volumes:

```bash
# Create multiple tickets to test performance
for i in {1..50}; do
  pnpm pm new "Test ticket $i" -d "Performance testing ticket" -p l
done

# Test list performance
time pnpm pm all
```

### Usability Testing

Document pain points and improvements:

```bash
# Test command discoverability
pnpm pm help

# Test error handling
pnpm pm start invalid-id

# Test auto-completion (if implemented)
pnpm pm start <tab><tab>
```

## Data Collection and Analysis

### Usage Metrics

Track actual usage patterns:

```bash
# Count tickets by status
pnpm pm stats --by-status

# Count tickets by priority
pnpm pm stats --by-priority

# Show development velocity
pnpm pm stats --velocity --timeframe week
```

### Issue Identification

Document usability issues through tickets:

```bash
# Create tickets for UX improvements
pnpm pm new "Improve command output formatting" -d "List output hard to read" -p l --labels ux

# Track feature requests
pnpm pm new "Add ticket templates" -d "Common ticket types need templates" -p m --labels feature-request
```

## Best Practices

### 1. Consistent Usage

- Use project-manager for ALL development work
- Don't bypass the system for "quick fixes"
- Document both successes and failures

### 2. Realistic Scenarios

- Create tickets with realistic complexity
- Use actual project deadlines and priorities
- Test with real team collaboration patterns

### 3. Feedback Loop

- Regularly review and improve based on usage
- Create tickets for system improvements
- Document lessons learned

### 4. Development Aliases Usage

Use appropriate aliases for different scenarios:

```bash
# Fast development (recommended for daily use)
pnpm pm new "My task" -d "Description" -p h

# Production testing (when validating built version)
pnpm run build && node packages/cli/dist/bin/pm.js todo

# Legacy quick commands (for backwards compatibility)
pnpm pm quick new "Legacy task"
```

## Troubleshooting

### Common Issues

1. **Alias not found**

   ```bash
   # Aliases may not persist across bash sessions
   # Use direct commands instead
   pnpm pm todo
   ```

2. **Command not found**

   ```bash
   # Use direct pnpm pm command
   pnpm pm todo
   ```

3. **Performance issues**

   ```bash
   # Use built version for better performance
   pnpm run build && node packages/cli/dist/bin/pm.js todo
   ```

### Debug Mode

Enable verbose output for troubleshooting:

```bash
# Use pnpm pm directly for debug output
pnpm pm new "Debug ticket" --verbose
```

### Known Limitations

1. **Development Aliases**: May not persist across bash sessions in some environments
2. **Comment Command**: Not yet implemented - use progress tickets as workaround
3. **Ticket ID Management**: Must manually capture and track ticket IDs from command output

## Success Metrics

### Quantitative Measures

- All development work tracked through system
- CLI commands used successfully in daily workflow
- Performance acceptable for realistic data volumes
- Error rates low for common operations

### Qualitative Measures

- System feels natural to use
- Reduces cognitive load vs. external tools
- Improves development productivity
- Team adoption and satisfaction

## Continuous Improvement

### Regular Reviews

- Weekly dogfooding retrospectives
- Monthly feature usage analysis
- Quarterly system evolution planning

### Feedback Integration

- Convert pain points to improvement tickets
- Prioritize based on actual usage impact
- Implement improvements and re-test

## Related Documents

- [Testing Strategy](./testing-strategy.md) - Overall testing approach including dogfooding
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Development process and guidelines
- [CLAUDE.md](../../CLAUDE.md) - AI assistant integration for development
- [Architecture Reference](../reference/architecture.md) - System design and components
