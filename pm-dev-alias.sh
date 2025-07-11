#!/bin/bash
# Development alias for project-manager CLI
# This script provides convenient shortcuts for development

# Function to run CLI with tsx (no build required)
run_tsx() {
    pnpm --silent --no-progress dev "$@" 2>/dev/null
}

# Function to run CLI with build (for production testing)
build_and_run() {
    echo "Building project-manager..."
    pnpm --silent run build > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "Build failed. Please check errors."
        pnpm --silent run build
        return 1
    fi
    
    # Run the CLI with provided arguments
    node packages/cli/dist/bin/pm.js "$@"
}

# Primary development aliases (using tsx for speed)
alias pm='run_tsx'
alias pm-new='run_tsx new'
alias pm-todo='run_tsx todo'
alias pm-wip='run_tsx wip'
alias pm-all='run_tsx all'
alias pm-start='run_tsx start'
alias pm-done='run_tsx done'

# Legacy quick command aliases (still available)
alias pm-quick='run_tsx quick'
alias pm-quick-new='run_tsx quick new'
alias pm-quick-todo='run_tsx quick todo'
alias pm-quick-wip='run_tsx quick wip'
alias pm-quick-all='run_tsx quick all'
alias pm-quick-start='run_tsx quick start'
alias pm-quick-done='run_tsx quick done'

# Build-based aliases for production testing
alias pm-build='build_and_run'
alias pm-build-new='pm-build new'
alias pm-build-todo='pm-build todo'
alias pm-build-wip='pm-build wip'
alias pm-build-all='pm-build all'
alias pm-build-start='pm-build start'
alias pm-build-done='pm-build done'

echo "Development aliases created:"
echo "📦 Fast development (tsx - no build required):"
echo "  pm              - Run CLI directly with tsx"
echo "  pm-new          - Create new ticket"
echo "  pm-todo         - List pending tickets"
echo "  pm-wip          - List work-in-progress"
echo "  pm-all          - List all tickets"
echo "  pm-start        - Start working on ticket"
echo "  pm-done         - Mark ticket as done"
echo ""
echo "🔧 Legacy quick commands (still available):"
echo "  pm-quick        - Quick commands group"
echo "  pm-quick-*      - All quick command variants"
echo ""
echo "🏗️  Production testing (build required):"
echo "  pm-build        - Build and run CLI"
echo "  pm-build-*      - Build-based versions of above"
echo ""
echo "To use these aliases, run: source pm-dev-alias.sh"
echo "💡 Example usage:"
echo "  pm-new 'My task' -d 'Description' -p h"
echo "  pm-todo"
echo "  pm-start <ticket-id>"
echo "  pm-done <ticket-id>"
echo ""
echo "⚠️  Note: In some environments, aliases may not persist across different"
echo "    bash command executions. If aliases don't work, use direct commands:"
echo "    pnpm dev new 'My task' -d 'Description' -p h"
echo "    pnpm dev todo"
echo "    pnpm dev start <ticket-id>"
echo "    pnpm dev done <ticket-id>"