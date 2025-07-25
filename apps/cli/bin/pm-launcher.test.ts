#!/usr/bin/env tsx

/**
 * Security tests for pm-launcher.js
 *
 * This test verifies that the CLI launcher securely handles command line arguments
 * and is protected against shell injection attacks.
 */

import assert from 'node:assert'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function runTests() {
  console.log('🧪 Running CLI Launcher Security Tests...\n')

  // Test: Verify pm-launcher.js uses spawn instead of execSync
  {
    const launcherPath = join(__dirname, 'pm-launcher.js')
    const content = await readFile(launcherPath, 'utf-8')

    // Should not contain execSync import or usage
    assert(!content.includes('execSync'), 'Should not use execSync')
    assert(
      !content.includes("from 'node:child_process'") || content.includes('spawn'),
      'Should import spawn'
    )

    // Should use spawn with array arguments
    assert(
      content.includes("spawn('tsx', [srcPath, ...args]"),
      'Should use spawn with array arguments'
    )

    // Should disable shell interpretation
    assert(content.includes('shell: false'), 'Should disable shell interpretation')

    console.log('✅ Code structure security test passed')
  }

  // Test: Verify no string concatenation in command construction
  {
    const launcherPath = join(__dirname, 'pm-launcher.js')
    const content = await readFile(launcherPath, 'utf-8')

    // Should not contain dangerous string concatenation patterns
    assert(!content.includes('`tsx'), 'Should not use template literals for command construction')
    assert(
      !content.includes('tsx "'),
      'Should not use string concatenation for command construction'
    )
    assert(!content.includes(".join(' ')"), 'Should not join arguments with spaces')

    console.log('✅ String concatenation security test passed')
  }

  // Test: Verify secure argument handling
  {
    const launcherPath = join(__dirname, 'pm-launcher.js')
    const content = await readFile(launcherPath, 'utf-8')

    // Should pass arguments as array elements to spawn
    assert(content.includes('[srcPath, ...args]'), 'Should spread args array into spawn arguments')

    // Should handle process events securely
    assert(content.includes("child.on('close'"), 'Should handle close event')
    assert(content.includes("child.on('error'"), 'Should handle error event')

    console.log('✅ Argument handling security test passed')
  }

  // Test: Verify stdio inheritance is preserved
  {
    const launcherPath = join(__dirname, 'pm-launcher.js')
    const content = await readFile(launcherPath, 'utf-8')

    // Should inherit stdio for proper CLI interaction
    assert(content.includes("stdio: 'inherit'"), 'Should inherit stdio')

    console.log('✅ stdio inheritance test passed')
  }

  console.log('\n🎉 All CLI launcher security tests passed!')
  console.log('The CLI launcher is now protected against shell injection attacks.')
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(error => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })
}
