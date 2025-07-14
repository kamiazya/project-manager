# Development Tips

This document contains practical tips and best practices for efficient development in the Project Manager monorepo.

## Table of Contents

1. [Hot-Reload Development Setup](#hot-reload-development-setup)
2. [Advanced pnpm Configuration](#advanced-pnpm-configuration)
   - [publishConfig for Dev/Prod Separation](#publishconfig-development-vs-production-separation)
   - [Custom Export Conditions](#custom-export-conditions)
   - [Package Configuration Patterns](#advanced-package-configuration-patterns)
   - [Real Project Examples](#real-project-examples)
3. [Monorepo Package Development](#monorepo-package-development)
4. [Performance Optimization](#performance-optimization)
5. [Development Workflow](#development-workflow)

## Hot-Reload Development Setup

### Problem: Slow Development Cycle

Traditional Node.js development requires building TypeScript before execution, which significantly slows down the development cycle:

- **TypeScript compilation + execution**: ~11 seconds
- **Direct tsx execution**: ~1 second
- **Speed improvement**: 10x faster

### Solution: Development Wrapper Pattern

Use tsx-based development wrappers that automatically set environment variables and provide hot-reload capability.

#### Implementation Pattern

**1. Create Development Wrapper**

```typescript
// packages/{package}/src/bin/{command}-dev.ts
#!/usr/bin/env tsx

/**
 * Development wrapper for {command}.
 * This script automatically sets NODE_ENV=development before executing the main command.
 *
 * In production, this file is not included (see package.json publishConfig).
 * The production binary uses {command}.ts directly.
 */

// Force development environment
process.env.NODE_ENV = 'development'

// Import and execute the main command
import './{command}.ts'
```

**2. Configure package.json**

```json
{
  "bin": {
    "command-name": "src/bin/command-dev.ts"
  },
  "publishConfig": {
    "bin": {
      "command-name": "dist/bin/command.js"
    },
    "executableFiles": [
      "dist/bin/command.js"
    ]
  }
}
```

**3. Reinstall Dependencies**

After updating package.json bin configuration:

```bash
pnpm install  # Updates bin links in node_modules/.bin/
```

#### Benefits

- **10x faster execution** during development
- **Automatic environment setup** (NODE_ENV=development)
- **Hot-reload capability** with file watching
- **Production build integrity** maintained through publishConfig
- **Consistent development experience** across all packages

#### Examples in Project

- **CLI Package**: `pm-dev.ts` → `pm` command
- **MCP Server Package**: `mcp-server-dev.ts` → `pm-mcp-server` command with integrated hot reload

### Advanced Hot Reload: MCP Server Implementation

The MCP Server package features a sophisticated hot reload implementation that goes beyond simple TypeScript execution. It provides a production-quality development experience with intelligent file watching and process management.

#### Key Features

- ✅ **Environment-Based Activation**: Automatically enables hot reload when `NODE_ENV=development`
- ✅ **Debounced Restarts**: 300ms delay prevents excessive restarts during rapid file changes
- ✅ **Colorful Logging**: Color-coded console output for easy development monitoring
- ✅ **Graceful Shutdown**: 2-second timeout before force-killing unresponsive processes
- ✅ **Process Recovery**: Automatic restart on crashes with intelligent backoff
- ✅ **Native File Watching**: Uses Node.js fs.watch API with recursive directory monitoring
- ✅ **Zero External Dependencies**: No third-party file watching libraries required
- ✅ **AbortController Integration**: Modern async/await patterns with proper cancellation
- ✅ **Production Mode Support**: Falls back to direct execution when hot reload is disabled

#### Implementation Example

```typescript
// packages/mcp-server/src/bin/mcp-server-dev.ts
#!/usr/bin/env tsx

import { watch, access, readdir } from 'node:fs/promises'
import { constants } from 'node:fs'

// Environment-based hot reload activation
const enableHotReload = process.env.NODE_ENV === 'development'

if (!enableHotReload) {
  // Production: Direct execution
  import('./mcp-server.ts')
} else {
  // Development: Hot reload with file watching
  runWithHotReload()
}

async function runWithHotReload() {
  let watchController: AbortController | null = null
  const knownFiles = new Set<string>()

  // Initialize known files using async readdir
  async function initializeKnownFiles() {
    const files = await readdir(srcDir, { recursive: true })
    for (const file of files) {
      if (typeof file === 'string') knownFiles.add(file)
    }
  }

  // Native fs.watch with AbortController
  async function startWatching() {
    watchController = new AbortController()
    const watcher = watch(srcDir, { 
      recursive: true, 
      signal: watchController.signal 
    })

    for await (const event of watcher) {
      await handleFileEvent(event.eventType, event.filename)
    }
  }

  // Intelligent file event handling
  async function handleFileEvent(eventType: string, filename: string | null) {
    if (!filename) return

    if (eventType === 'rename') {
      try {
        await access(fullPath, constants.F_OK)
        // File exists - it was added
        if (!knownFiles.has(filename)) {
          log(`File added: ${relativePath}`)
          knownFiles.add(filename)
          debouncedRestart()
        }
      } catch {
        // File doesn't exist - it was removed
        if (knownFiles.has(filename)) {
          log(`File removed: ${relativePath}`)
          knownFiles.delete(filename)
          debouncedRestart()
        }
      }
    } else if (eventType === 'change') {
      log(`File changed: ${relativePath}`)
      debouncedRestart()
    }
  }

  await initializeKnownFiles()
  startWatching()
}
```

#### Usage Patterns

**Development with Hot Reload**

```bash
# Automatic hot reload (NODE_ENV=development default)
pnpm pm-mcp-server

# Manual environment control
NODE_ENV=development pnpm pm-mcp-server

# Configuration in .mcp.json
{
  "mcpServers": {
    "project-manager": {
      "command": "pnpm",
      "args": ["pm-mcp-server"]
    }
  }
}
```

**Production Mode**

```bash
# Disable hot reload
NODE_ENV=production pnpm pm-mcp-server

# Or use compiled version
node dist/bin/mcp-server.js
```

#### Benefits for AI Development

- **Consistent Development Environment**: AI assistants and human developers experience the same hot reload behavior
- **Fast Iteration Cycles**: 300ms debounced restarts provide optimal development speed
- **Clear Visual Feedback**: Color-coded logging makes development progress visible
- **Reliable Process Management**: Graceful shutdown prevents resource leaks
- **Zero Configuration**: Works out-of-the-box with sensible defaults

#### Advantages of Native fs.watch Implementation

**Reduced Dependencies**

- **No External Libraries**: Uses only Node.js built-in APIs (fs.watch, AbortController)
- **Smaller Bundle Size**: Eliminates chokidar and its dependencies
- **Fewer Security Vulnerabilities**: Reduced attack surface from external packages
- **Better Long-term Maintenance**: No need to update external file watching libraries

**Modern Node.js Patterns**

- **Async/Await Integration**: Native promises and async iterators for clean code
- **AbortController Support**: Standard cancellation patterns for proper cleanup
- **Recursive Directory Watching**: Built-in recursive option on all major platforms
- **Event Type Detection**: Intelligent handling of rename vs change events

**Performance Benefits**

- **Direct OS Integration**: Native OS file system events without wrapper overhead
- **Memory Efficiency**: Reduced memory footprint compared to feature-rich libraries
- **Startup Speed**: Faster initialization without additional dependency loading

**Platform Compatibility**

- **Cross-Platform Consistency**: Works reliably on Windows, macOS, and Linux
- **Node.js Version Alignment**: Uses APIs available in modern Node.js LTS versions
- **Future-Proof**: Benefits from Node.js core improvements and optimizations

## Advanced pnpm Configuration

### publishConfig: Development vs Production Separation

pnpm's `publishConfig` allows you to have different configurations for development and production, enabling efficient development while maintaining clean distribution packages.

#### Complete publishConfig Example

```json
{
  "name": "@project-manager/cli",
  "version": "0.0.0",
  "type": "module",

  // Development configuration (used during local development)
  "main": "src/index.ts",
  "types": "src/index.ts",
  "bin": {
    "pm": "src/bin/pm-dev.ts"
  },
  "exports": {
    ".": {
      "@project-manager/source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },

  // Production configuration (used when publishing to npm)
  "publishConfig": {
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "bin": {
      "pm": "dist/bin/pm.js"
    },
    "exports": {
      ".": {
        "types": "./dist/index.d.ts",
        "import": "./dist/index.js"
      }
    },
    "executableFiles": [
      "dist/bin/pm.js"
    ]
  }
}
```

#### Key Benefits

1. **Development Speed**: Direct TypeScript execution without build step
2. **Production Ready**: Clean compiled JavaScript for distribution
3. **Automatic Switching**: pnpm automatically uses correct configuration
4. **Binary Management**: Different executables for dev/prod environments

### Custom Export Conditions

Export conditions allow different module resolution based on environment or consumer needs.

#### Custom Condition Configuration

**Package Export with Custom Condition**

```json
{
  "exports": {
    ".": {
      "@project-manager/source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

**Consumer TypeScript Configuration**

```json
{
  "compilerOptions": {
    "customConditions": ["@project-manager/source"]
  }
}
```

#### How Custom Conditions Work

1. **With Custom Condition**: Import resolves to `./src/index.ts` (TypeScript source)
2. **Without Custom Condition**: Import resolves to `./dist/index.js` (compiled JavaScript)
3. **Types Always Available**: TypeScript types available in both cases

#### Practical Benefits

```typescript
// In packages with customConditions: ["@project-manager/source"]
import { Ticket } from '@project-manager/core'
// ↑ Resolves to: @project-manager/core/src/index.ts

// In packages without custom conditions
import { Ticket } from '@project-manager/core'
// ↑ Resolves to: @project-manager/core/dist/index.js
```

**Development Benefits:**

- **Faster Compilation**: Direct TypeScript imports skip build step
- **Better Debugging**: Source maps and original code for debugging
- **Hot Reload**: Changes immediately available without rebuild

**Production Benefits:**

- **Compiled Code**: Optimized JavaScript for runtime performance
- **Type Safety**: Full TypeScript checking during build process
- **Distribution Ready**: Clean compiled output for npm packages

### Advanced Package Configuration Patterns

#### 1. Binary Package Pattern (CLI tools)

```json
{
  "bin": {
    "command-name": "src/bin/command-dev.ts"
  },
  "publishConfig": {
    "bin": {
      "command-name": "dist/bin/command.js"
    },
    "executableFiles": [
      "dist/bin/command.js"
    ]
  }
}
```

#### 2. Library Package Pattern (Shared code)

```json
{
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": {
      "@project-manager/source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "publishConfig": {
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "exports": {
      ".": {
        "types": "./dist/index.d.ts",
        "import": "./dist/index.js"
      }
    }
  }
}
```

#### 3. Server Package Pattern (Long-running services)

```json
{
  "main": "src/index.ts",
  "bin": {
    "server-name": "src/bin/server-dev.ts"
  },
  "publishConfig": {
    "main": "dist/index.js",
    "bin": {
      "server-name": "dist/bin/server.js"
    }
  }
}
```

### Workspace Dependencies

Use workspace protocol for internal package dependencies:

```json
{
  "dependencies": {
    "@project-manager/core": "workspace:*",
    "@project-manager/shared": "workspace:*"
  }
}
```

**Benefits:**

- **Always Latest**: Uses current workspace version
- **Development Efficiency**: No need to publish internal changes
- **Build Optimization**: Can leverage source conditions for faster builds

### Real Project Examples

This project uses these patterns extensively:

#### CLI Package (`packages/cli/`)

- **Development**: `pm` command executes `src/bin/pm-dev.ts` via tsx
- **Production**: `pm` command executes `dist/bin/pm.js` as compiled JavaScript
- **Custom Conditions**: Uses `@project-manager/source` for direct TypeScript imports

#### MCP Server Package (`packages/mcp-server/`)

- **Development**: `pm-mcp-server` executes `src/bin/mcp-server-dev.ts` with integrated hot-reload
  - Automatic file watching with 300ms debounced restarts
  - Colorful logging for enhanced development experience
  - Graceful shutdown with 2-second timeout
  - Environment-based automatic switching (NODE_ENV=development)
- **Production**: `pm-mcp-server` executes `dist/bin/mcp-server.js` for deployment

#### Core Package (`packages/core/`)

- **Development**: Other packages import TypeScript source directly
- **Production**: Other packages import compiled JavaScript
- **Exports**: Custom condition enables source vs compiled module resolution

### Configuration Best Practices

1. **Consistent Patterns**: Use same publishConfig pattern across all packages
2. **Custom Conditions**: Enable for all internal packages consuming other workspace packages
3. **Build Verification**: Regularly test publishConfig by running production builds
4. **Documentation**: Keep examples in sync with actual package.json files

### Testing Configuration Changes

```bash
# Test development configuration
pnpm pm --help                   # Should execute quickly via tsx

# Test production configuration
pnpm pack                        # Create production package
tar -tf package.tgz              # Verify only dist/ files included

# Test custom conditions
grep -r "@project-manager/source" packages/*/tsconfig.json
# Should show customConditions in consuming packages

# Verify workspace dependencies
pnpm list | grep "workspace:"    # Should show internal dependencies
```

## Monorepo Package Development

### pnpm Workspace Configuration

When developing packages in a monorepo, use pnpm workspace dependencies for cross-package references:

```json
{
  "dependencies": {
    "@project-manager/core": "workspace:*",
    "@project-manager/shared": "workspace:*"
  }
}
```

### Command Execution Best Practices

**Direct Package Scripts (Recommended)**

```bash
# Execute from monorepo root using pnpm workspace
pnpm pm new "Task" -p h           # Fast tsx execution
pnpm run build                    # Build all packages
pnpm run typecheck               # Type check all packages
```

**Package-Level Execution**

```bash
# When working within a specific package
cd packages/cli
pnpm dev                         # Package-specific development
pnpm build                       # Package-specific build
```

### Environment Separation

Use NODE_ENV-based configuration for development/production separation:

```typescript
const isDevelopment = process.env.NODE_ENV === 'development'
const configPath = isDevelopment
  ? `${baseDir}-dev`
  : baseDir
```

This ensures development activities don't interfere with production data.

## Performance Optimization

### Development vs Production Builds

**Development Mode (tsx)**

- Direct TypeScript execution
- No build step required
- Instant startup (~1 second)
- Hot-reload capabilities
- Development-specific configurations

**Production Mode (compiled)**

- Pre-compiled JavaScript
- Optimized for distribution
- Slower startup (~11 seconds)
- Production-ready configurations
- Smaller bundle sizes

### Choose the Right Mode

**Use Development Mode When:**

- Active development and testing
- Frequent code changes
- Debugging and experimentation
- Local development workflows

**Use Production Mode When:**

- Final testing before release
- Performance benchmarking
- Production deployment
- Distribution package testing

## Development Workflow

### Quick Development Setup

```bash
# 1. Setup development environment
source pm-dev-alias.sh           # Load convenience aliases (optional)

# 2. Start development with hot-reload
pnpm pm-mcp-server               # MCP server with integrated hot reload
pnpm pm                          # CLI development

# 3. Run tests and checks
pnpm run test                    # Run all tests
pnpm run typecheck              # Type checking
pnpm run build                  # Production build test
```

### Development Aliases (Optional)

For enhanced productivity, use development aliases:

```bash
# Load aliases
source pm-dev-alias.sh

# Quick commands
pm new "Task" -p h              # Create high-priority task
pm-todo                         # List pending tasks
pm-start <id>                   # Start task
pm-done <id>                    # Complete task
```

**Note**: Aliases may not persist across all environments. The `pnpm pm` commands are more reliable.

### Best Practices

1. **Environment Consistency**: Always use NODE_ENV=development for development work
2. **Hot-Reload First**: Prefer tsx-based commands during active development
3. **Build Testing**: Regularly test production builds to catch integration issues
4. **Dependency Management**: Use `pnpm install` after bin configuration changes
5. **Documentation**: Update relevant documentation when adding new development commands

## Troubleshooting

### Common Issues

**1. Bin Commands Not Found**

```bash
# Solution: Reinstall dependencies
pnpm install
```

**2. TypeScript Compilation Errors**

```bash
# Check for cross-package import issues
pnpm run typecheck

# Fix by updating tsconfig.json customConditions
{
  "compilerOptions": {
    "customConditions": ["@project-manager/source"]
  }
}
```

**3. Environment Variable Issues**

```bash
# Ensure NODE_ENV is set correctly
echo $NODE_ENV  # Should show 'development' in dev mode

# Check wrapper script execution
cat packages/{package}/src/bin/{command}-dev.ts
```

**4. Performance Degradation**

```bash
# Compare execution times
time pnpm pm --help              # tsx execution
time node dist/bin/pm.js --help  # compiled execution
```

**5. publishConfig Not Working**

```bash
# Test publishConfig by creating a pack
pnpm pack

# Extract and verify contents
tar -tf package.tgz | head -20

# Should show dist/ files, not src/ files in production pack
```

**6. Custom Conditions Not Resolving**

```bash
# Check TypeScript configuration
cat tsconfig.json | grep customConditions

# Should include: "customConditions": ["@project-manager/source"]

# Verify package exports
node -e "console.log(require.resolve('@project-manager/core'))"
```

**7. Workspace Dependencies Issues**

```bash
# Verify workspace dependencies are linked correctly
pnpm list --depth=0

# Should show workspace packages with "workspace:" prefix

# Re-link if needed
pnpm install
```

**8. MCP Hot Reload Issues**

```bash
# Check hot reload status
echo $NODE_ENV  # Should show 'development' for hot reload

# Test MCP server startup
timeout 5s pnpm pm-mcp-server

# Look for hot reload indicators in output:
# [Hot Reload] Starting MCP server...
# [Hot Reload] Watching for changes in src/

# Verify file watching works
touch packages/mcp-server/src/test.ts
# Should see: [Hot Reload] File added: src/test.ts

# Force production mode
NODE_ENV=production pnpm pm-mcp-server  # Should skip hot reload
```

### Getting Help

When encountering development issues:

1. Check this document first
2. Review package-specific README files
3. Consult the main project documentation
4. Create a ticket for systematic issue tracking

## AI-Assisted Development Tips

### Watch Mode Development

When developing with watch modes (tsx watch, pnpm dev, etc.), special considerations are needed for AI-assisted workflows:

#### Problem: AI Waiting on Watch Processes

Watch modes create long-running processes that can cause AI assistants to wait indefinitely:

```bash
# This will cause AI to wait forever
pnpm dev  # Starts watch mode, never exits
```

#### Solutions for AI Development

**1. Use Timeout Commands**

```bash
# AI can use timeout to limit execution time
timeout 5s pnpm dev

# Check if process started successfully
timeout 3s pnpm exec tsx src/bin/mcp-server-dev.ts
```

**2. Separate Terminal Verification**

For AI assistants, recommend using separate verification commands:

```bash
# Instead of running watch mode directly
# Verify build/compilation works first
pnpm run typecheck  # Quick verification
pnpm run build      # Full build test

# Then separately test tsx execution
timeout 2s pnpm exec tsx src/bin/command.ts --help
```

**3. Process Validation Pattern**

```bash
# Test that watch process can start
timeout 5s pnpm dev 2>&1 | head -10

# Look for success indicators in output:
# - "Server started successfully"
# - "Watching for file changes"
# - No compilation errors

# For MCP Server hot reload specifically
timeout 5s pnpm pm-mcp-server 2>&1 | head -10

# Look for MCP hot reload indicators:
# - "[Hot Reload] Starting MCP server..."
# - "[Hot Reload] Watching for changes in src/"
# - No TypeScript compilation errors
```

#### Verification Checklist for AI

When testing hot-reload development:

- ✅ TypeScript compilation passes (`pnpm run typecheck`)
- ✅ tsx can execute the file (`timeout 2s tsx src/bin/file.ts --help`)
- ✅ Development wrapper sets NODE_ENV correctly
- ✅ Watch mode starts without errors (`timeout 5s pnpm dev`)
- ✅ File changes trigger recompilation (manual verification needed)

**Additional MCP Server Hot Reload Verification:**

- ✅ MCP server hot reload activates (`timeout 5s pnpm pm-mcp-server`)
- ✅ Color-coded logging appears (`[Hot Reload]` prefix in cyan)
- ✅ File watching works (create/modify files in `src/`)
- ✅ Debounced restarts prevent excessive reloading
- ✅ Production mode skips hot reload (`NODE_ENV=production pnpm pm-mcp-server`)

#### Watch Mode Performance Tips

**Fast Development Validation:**

```bash
# Quick syntax check
pnpm run typecheck

# Quick execution test
tsx src/bin/command.ts --version

# Watch mode startup test
timeout 3s pnpm dev
```

**Common Watch Mode Commands:**

```bash
# MCP Server with integrated hot-reload
pnpm pm-mcp-server  # Intelligent file watching with debounced restarts

# Alternative: Package-specific development
cd packages/mcp-server && pnpm dev  # Legacy tsx watch mode

# CLI development (no watch needed - direct tsx execution)
pnpm pm <command>  # Direct execution via tsx

# Type checking in watch mode
pnpm run typecheck --watch
```

### VitePress Optimization Techniques

During investigation, we tested VitePress performance optimizations but found they are **incompatible with ES modules**:

#### Incompatible Techniques (CommonJS only)

```javascript
// ❌ Does not work in ES modules
if ('enableCompileCache' in module && typeof module.enableCompileCache === 'function') {
  module.enableCompileCache?.()
}
```

**Error:** `ReferenceError: module is not defined in ES module scope`

#### Alternative ES Module Optimizations

Since VitePress techniques don't apply to ES modules, focus on these alternatives:

1. **tsx Direct Execution**: ~1 second vs ~11 seconds build time
2. **Development Wrappers**: Automatic NODE_ENV configuration
3. **Hot Reload**: File watching with automatic restart
4. **Selective Imports**: Use tree-shaking friendly imports

```typescript
// ✅ ES module compatible optimizations
import { specific } from 'large-library/specific'  // Tree-shaking friendly
const { dynamic } = await import('./heavy-module.ts')  // Lazy loading
```

#### Lesson Learned

Always verify optimization techniques in your target environment:

- VitePress uses CommonJS (`require()`, `module.exports`)
- Our project uses ES modules (`import`, `export`)
- Techniques are not always transferable between module systems

## Related Documents

- [Coding Guidelines](./coding-guidelines.md) - Code quality and architecture patterns
- [Testing Strategy](./testing-strategy.md) - Testing approaches and best practices
- [CLAUDE.md](../../CLAUDE.md) - AI assistant development guidelines
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - General contribution guidelines
