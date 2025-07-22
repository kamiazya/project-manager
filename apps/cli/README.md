# Project Manager CLI

**A local-first ticket management system designed for AI-assisted development workflows.**

Transform your development process with organized, AI-friendly project management that keeps context and maintains focus on primary objectives.

## 🎯 Why Project Manager

**For AI-Driven Developers:**

- **Prevent Context Loss**: Maintain focus during AI assistant sessions
- **Shared Understanding**: Single source of truth for humans and AI systems
- **Shift-Left Development**: Quality assurance and design decisions before coding
- **International Collaboration**: Work efficiently across language barriers

**For Development Teams:**

- **Issue-Based Workflow**: Organized development through structured tickets
- **Local-First**: Full control over your data, works offline
- **AI Integration**: Seamless collaboration with AI assistants via MCP protocol
- **Cross-Platform**: Works on Windows, macOS, and Linux

## ⚡ Quick Start

### Installation

> NOTE: For development installation, clone the repository and build from source.

```bash
npm install -g @project-manager/cli
```

### Create Your First Ticket

```bash
# Interactive mode - guided prompts
pm create

# Command line mode - fast creation
pm create "Fix login bug" -d "Users cannot login with email" -p high -t bug

# Quick creation with create command
pm create "Add dark mode toggle"
```

### Manage Your Workflow

```bash
# View all tickets
pm list

# Show work in progress
pm list --status in_progress

# Search tickets
pm search "authentication" --status pending

# View ticket details
pm show ticket-123

# Get project statistics (planned feature)
pm stats
```

## 📋 Core Commands

### Creating & Managing Tickets

```bash
# Create tickets with full details
pm create "Implement user authentication"
pm create "Fix mobile responsiveness" -p high -t bug

# Quick ticket creation
pm create "Research GraphQL libraries"
pm create "Update documentation" -p low

# Update ticket properties
pm update content ticket-456 -t "Updated title" -d "Updated description"
pm update status ticket-789 in_progress
pm update priority ticket-123 high

# View ticket details
pm show ticket-456

# Delete tickets (with confirmation)
pm delete ticket-789
pm delete ticket-789 --force  # Skip confirmation
```

### Updating Tickets

```bash
# Update ticket content (title and description)
pm update content ticket-123 --title "New title"
pm update content ticket-123 --description "New description"
pm update content ticket-123 -t "New title" -d "New description"

# Update ticket status
pm update status ticket-123 pending
pm update status ticket-123 in_progress
pm update status ticket-123 completed
pm update status ticket-123 archived

# Update ticket priority  
pm update priority ticket-123 high
pm update priority ticket-123 medium
pm update priority ticket-123 low

# Legacy update command (deprecated - will be removed in future version)
# pm update ticket-123 -t "Title" -d "Description"
```

### Project Overview & Filtering

```bash
# List all tickets
pm list

# Filter by status
pm list --status pending
pm list --status in_progress
pm list --status completed

# Filter by priority
pm list --priority high
pm list --priority medium,low

# Filter by type
pm list --type bug
pm list --type feature,task

# Multiple filters
pm list --status pending --priority high --type bug

# Compact view for quick scanning
pm list --output compact

# JSON output for automation
pm list --output json
```

### Project Statistics

```bash
# Overall project health
pm stats

# Current workload analysis
pm stats --breakdown

# Export data for reports
pm stats --output json > project-report.json
```

## 🤖 AI Integration

Project Manager includes built-in AI assistant integration via the Model Context Protocol (MCP).

### Setup for Claude Desktop

Add to your MCP configuration (`.mcp.json`):

```json
{
  "mcpServers": {
    "project-manager": {
      "command": "pm",
      "args": ["mcp"]
    }
  }
}
```

### AI-Powered Workflows

Once configured, AI assistants can:

- **Create and manage tickets** during development sessions
- **Track progress** and update ticket status
- **Maintain context** across multiple development sessions
- **Generate reports** and project summaries
- **Analyze workload** and suggest priorities

Example AI interaction:

```
You: "Help me implement user authentication"
AI: "I'll create a ticket for this and break it down into tasks..."
    → Creates ticket automatically
    → Tracks implementation progress
    → Updates status as work progresses
```

## 🔧 Configuration

### View Current Settings

```bash
pm config
```

### Auto-completion Setup

Enable shell auto-completion for faster command entry:

```bash
pm autocomplete
```

Follow the displayed instructions for your shell (bash, zsh, fish, PowerShell).

### Storage Location

Data is stored locally following platform-specific directory conventions:

- **Windows**: `%APPDATA%\project-manager[-dev|-test]\`
- **macOS**: `~/Library/Application Support/project-manager[-dev|-test]/`
- **Linux**: `~/.config/project-manager[-dev|-test]/`

Environment-specific directories:

- **Production**: `project-manager`
- **Development**: `project-manager-dev`
- **Test**: `project-manager-test`

### Environment Variables

- `NODE_ENV`: Set to `development` for enhanced debugging
- `PM_STORAGE_PATH`: Override default storage location

## 📊 Output Formats

Choose the output format that works best for your workflow:

### Table (Default)

```bash
pm list
# ┌─────────────┬─────────────────────┬────────────┬──────────┬──────────┐
# │ ID          │ Title               │ Status     │ Priority │ Type     │
# │ ticket-123  │ Fix login bug       │ pending    │ high     │ bug      │
# │ ticket-456  │ Add dark mode       │ in_progress│ medium   │ feature  │
# └─────────────┴─────────────────────┴────────────┴──────────┴──────────┘
```

### Compact (Space-efficient)

```bash
pm list --output compact
# ticket-123  Fix login bug       [pending] high bug
# ticket-456  Add dark mode       [in_progress] medium feature
```

### JSON (Automation-friendly)

```bash
pm list --output json
# [{"id":"ticket-123","title":"Fix login bug","status":"pending",...}]
```

## 🚀 Advanced Features

### Aliases for Common Commands

```bash
# Short aliases for frequent operations
pm ls          # Same as: pm list
pm rm ticket-123  # Same as: pm delete ticket-123
pm new "Task"  # Same as: pm create "Task"
```

### Batch Operations

```bash
# Create multiple tickets from a file
pm create --from-file tickets.txt

# Update multiple tickets (example for future feature)
# pm update status ticket-123,ticket-456 completed

# Export project data
pm list --output json > backup.json
```

### Integration Examples

```bash
# Git integration - create ticket from commit
git log --oneline -1 | pm create --from-stdin

# Integration with other tools
pm list --status pending --output json | jq '.[] | .title'

# Automation scripts
#!/bin/bash
PENDING_COUNT=$(pm list --status pending --output json | jq length)
echo "Pending tickets: $PENDING_COUNT"
```

## 🐛 Troubleshooting

### Common Issues

**Command not found: `pm`**

```bash
# Check installation
npm list -g @project-manager/cli

# Reinstall if needed
npm install -g @project-manager/cli
```

**Storage/permission errors**

```bash
# Check storage location
pm config

# Fix permissions (Linux/macOS)
chmod 755 ~/.config/project-manager/
```

**Auto-completion not working**

```bash
# Reconfigure auto-completion
pm autocomplete

# For bash, ensure .bashrc sources the completion file
# For zsh, ensure .zshrc includes the completion directory
```

**AI integration not working**

```bash
# Test MCP server
pm mcp --version

# Check configuration
cat ~/.mcp.json  # Linux/macOS
type %APPDATA%\.mcp.json  # Windows
```

### Getting Help

```bash
# Command help
pm help
pm help create
pm help list

# Debug mode for troubleshooting
DEBUG=* pm list

# Check version
pm --version
```

## 📈 Use Cases

### Solo Development

- Track personal project tasks
- Maintain context during AI-assisted coding
- Organize feature development and bug fixes

### Team Collaboration

- Share ticket status across team members
- Coordinate work between humans and AI assistants
- Maintain project roadmap and progress tracking

### AI-Driven Projects

- Enable AI assistants to create and manage tickets
- Preserve context across multiple AI sessions
- Track implementation decisions and progress

### International Development

- Work efficiently in non-native languages
- Focus on engineering without language barriers
- Collaborate with international open source projects

## 🔗 Related Tools

- **[Project Manager Core](../core/)**: Core business logic and domain models
- **[MCP Server](../mcp-server/)**: AI integration server for Claude and other assistants
- **GitHub Issues Sync**: (Coming soon) Bidirectional synchronization
- **Jira Integration**: (Coming soon) Enterprise project management integration

## 📝 License

See the main project [LICENSE](https://github.com/kamiazya/project-manager/blob/main/LICENSE) file.

---

**Start managing your projects more effectively today!**

```bash
npm install -g @project-manager/cli
pm create "My first ticket"
```
