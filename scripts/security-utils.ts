/**
 * Security utilities for command line argument sanitization and validation
 */

/**
 * Sanitize command line arguments to prevent shell injection attacks
 * Only allows safe arguments that don't contain shell metacharacters
 *
 * @param args - Array of command line arguments to sanitize
 * @param logPrefix - Optional prefix for log messages (e.g., '[Hot Reload]')
 * @returns Array of sanitized arguments with unsafe ones filtered out
 */
export function sanitizeCommandLineArgs(args: string[], logPrefix = ''): string[] {
  const safeArgs: string[] = []
  const prefix = logPrefix ? `${logPrefix} ` : ''

  // Limit total number of arguments to prevent resource exhaustion
  if (args.length > 50) {
    console.warn(`${prefix}Too many arguments provided (${args.length}), limiting to first 50`)
    args = args.slice(0, 50)
  }

  for (const arg of args) {
    // Check for potentially dangerous characters that could be used for shell injection
    if (typeof arg !== 'string') {
      console.warn(`${prefix}Skipping non-string argument:`, arg)
      continue
    }

    // Reject empty arguments
    if (arg.length === 0) {
      continue
    }

    // Allow only safe characters: alphanumeric, hyphens, underscores, dots, forward slashes, colons, equals
    // This covers most legitimate MCP server arguments while blocking shell metacharacters
    // Specifically blocks: $, `, ;, |, &, >, <, (, ), [, ], {, }, *, ?, \, ", ', space, tab
    if (!/^[a-zA-Z0-9\-_./:=]+$/.test(arg)) {
      console.warn(`${prefix}Skipping potentially unsafe argument: ${arg}`)
      continue
    }

    // Limit argument length to prevent buffer overflow attempts
    if (arg.length > 500) {
      console.warn(`${prefix}Skipping oversized argument (${arg.length} chars)`)
      continue
    }

    // Additional validation: reject arguments that look like command injection attempts
    const suspiciousPatterns = [/&&/, /\|\|/, /;/, /\$\(/, /`/, /\$\{/, />/, /</, /\|/]

    if (suspiciousPatterns.some(pattern => pattern.test(arg))) {
      console.warn(`${prefix}Skipping argument with suspicious pattern: ${arg}`)
      continue
    }

    safeArgs.push(arg)
  }

  return safeArgs
}
