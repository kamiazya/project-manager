# Asynchronous Delegation Best Practices

## Overview

This guide provides best practices for creating tasks that can be effectively delegated to collaborators working asynchronously with limited context. This applies to:
- AI coding agents (Devin, Claude Code Action, etc.)
- Remote developers in different time zones
- Contributors unfamiliar with the codebase
- Automated systems and bots

## Core Principles

### 1. Self-Contained Tasks
Each task must be completable without requiring additional clarification or context gathering.

**Why**: Asynchronous workers cannot easily ask questions or get immediate feedback.

**How**: Include all necessary information upfront, from requirements to validation criteria.

### 2. Clear Success Criteria
Define explicit, measurable outcomes that indicate task completion.

**Why**: Workers need objective ways to verify their work is complete and correct.

**How**: Use checklists, test cases, and specific acceptance criteria.

### 3. Atomic Scope
Tasks should be indivisible units of work with no external dependencies.

**Why**: Prevents blocking on other work and enables parallel execution.

**How**: Break larger features into independent, sequential tasks.

## Implementation Guidelines

### For AI Coding Agents

AI agents require extreme precision and literal interpretation. They excel at well-defined implementation tasks but struggle with ambiguity.

#### Task Structure Template

````markdown
---
title: [Specific action verb] [specific component/function]
complexity: simple|medium|complex
estimated_hours: [1-8]
---

## Objective
[One sentence describing what needs to be accomplished]

## Context
- **Files to modify**: [Exact file paths]
- **Patterns to follow**: [Reference to existing code patterns]
- **Dependencies**: [Required libraries and versions]

## Specifications
1. [Specific requirement with technical details]
2. [Include parameter types, return values, error handling]
3. [Reference existing patterns in the codebase]

## Validation
- [ ] [Specific test that must pass]
- [ ] [Linting/formatting requirements]
- [ ] [Performance criteria if applicable]

## Examples
```code
// Input example
[concrete example]

// Expected output
[concrete example]
```
````

#### Example: Well-Structured AI Agent Task

````markdown
---
title: Implement email validation in auth module
complexity: simple
estimated_hours: 2
---

## Objective
Add email validation function following existing validation patterns in the auth module.

## Context
- **Files to modify**: `src/auth/validators.ts`
- **Patterns to follow**: Match structure of existing `validatePassword` function
- **Dependencies**: None (use built-in regex)

## Specifications
1. Create function `validateEmail(email: string): ValidationResult`
2. Use regex pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
3. Return `{valid: true, value: email}` for valid emails
4. Return `{valid: false, error: "Invalid email format"}` for invalid
5. Add JSDoc matching existing functions

## Validation
- [ ] All test cases in `src/auth/validators.test.ts` pass
- [ ] No TypeScript errors
- [ ] Function is exported from module

## Examples
```typescript
// Valid inputs
validateEmail("user@example.com") // {valid: true, value: "user@example.com"}
validateEmail("name+tag@domain.co.uk") // {valid: true, value: "name+tag@domain.co.uk"}

// Invalid inputs
validateEmail("invalid.email") // {valid: false, error: "Invalid email format"}
validateEmail("@domain.com") // {valid: false, error: "Invalid email format"}
```
````

### For Remote Human Developers

Human developers need context and rationale but can handle some ambiguity and make reasonable decisions.

#### Task Structure Guidelines

1. **Background**: Explain why this task is needed
2. **Technical Context**: Architecture decisions and constraints
3. **Success Metrics**: Business or technical goals
4. **Resources**: Links to documentation, designs, or discussions
5. **Flexibility**: Areas where developer judgment is welcomed

#### Example: Remote Developer Task

````markdown
---
title: Optimize dashboard query performance
priority: high
context: Customer complaints about slow loading
---

## Background
Users report 5-10 second load times for the main dashboard. Analytics show this affects 30% of daily active users during peak hours.

## Technical Investigation
- Current implementation uses N+1 queries in `DashboardService`
- Database indexes exist but may not be utilized effectively
- Consider caching strategy for frequently accessed data

## Success Criteria
- Dashboard loads in < 2 seconds for 95th percentile
- Solution maintains real-time data accuracy
- Implementation follows our established caching patterns

## Resources
- [Performance profiling results](../analysis/dashboard-performance.md)
- [Current architecture diagram](../architecture/dashboard.md)
- Similar optimization in commit `a1b2c3d`

## Developer Discretion
- Choice of caching technology (Redis vs in-memory)
- Whether to implement progressive loading
- Specific query optimization techniques
````

## Task Creation Workflow

### 1. Assess the Worker Type
Before creating a task, identify who will execute it:
- **AI Agent**: Repetitive, well-defined implementation
- **Remote Developer**: Complex problems requiring judgment
- **Either**: Simple, well-scoped tasks with clear patterns

### 2. Choose Appropriate Detail Level
- **AI Agents**: Maximum detail, no assumptions
- **Experienced Remote Developers**: Context and goals, trust expertise
- **New Contributors**: Balance between guidance and learning opportunity

### 3. Validate Task Completeness
Use this checklist before assigning:
- [ ] Can this be started without asking questions?
- [ ] Are success criteria objectively measurable?
- [ ] Are all dependencies and blockers identified?
- [ ] Is the scope appropriate for the worker type?

## Common Pitfalls and Solutions

### Pitfall 1: Assuming Implicit Knowledge
**Problem**: "Update the user service" - Which service? What kind of update?
**Solution**: "Update the UserAuthenticationService.validateCredentials method to support OAuth 2.0 tokens in addition to passwords"

### Pitfall 2: Unbounded Scope
**Problem**: "Improve application performance"
**Solution**: "Reduce login API response time from 500ms to 200ms by implementing connection pooling"

### Pitfall 3: Missing Context
**Problem**: "Fix the bug in checkout"
**Solution**: "Fix race condition in checkout process where concurrent requests can result in duplicate orders (see error logs from incident #1234)"

### Pitfall 4: Unclear Validation
**Problem**: "Make sure it works"
**Solution**: "Ensure all existing tests pass, plus new tests for OAuth token validation achieve 90% coverage"

## Measuring Success

Track these metrics to improve task delegation:

1. **Clarification Rate**: How often do workers need to ask questions?
   - Target: < 10% for AI agents, < 30% for human developers

2. **Completion Rate**: How often are tasks completed successfully first time?
   - Target: > 80% for well-structured tasks

3. **Rework Rate**: How often does completed work need significant changes?
   - Target: < 20%

4. **Time to Completion**: How long from assignment to successful merge?
   - Compare against estimates to refine future predictions

## Continuous Improvement

1. **Collect Feedback**: Ask workers what information was missing or confusing
2. **Analyze Failures**: When tasks fail, document why and update templates
3. **Share Patterns**: Build a library of successful task examples
4. **Iterate Process**: Regularly review and update these guidelines

## Related Resources

- [Issue Templates](../templates/issues/) - Pre-configured templates for common task types
- [Project Workflows](../contexts/ticket_management/WORKFLOWS.md) - How tasks fit into larger processes
- [Contributing Guide](../../CONTRIBUTING.md) - General contribution guidelines
- [Architecture Decisions](../architecture/adr/) - Context for technical decisions