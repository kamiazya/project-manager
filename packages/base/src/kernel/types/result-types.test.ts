/**
 * Tests for Result Types
 */

import { describe, expect, it } from 'vitest'
import {
  type ConfigurationError,
  ConfigurationErrorType,
  failure,
  flatMap,
  isFailure,
  isSuccess,
  map,
  match,
  notFoundError,
  parseError,
  type Result,
  success,
  unwrap,
  unwrapOr,
  validationError,
} from './result-types.ts'

describe('Result Types', () => {
  describe('Basic Operations', () => {
    it('should create success results', () => {
      const result = success('test value')
      expect(result.success).toBe(true)
      expect(result.data).toBe('test value')
    })

    it('should create failure results', () => {
      const result = failure('error message')
      expect(result.success).toBe(false)
      expect(result.error).toBe('error message')
    })

    it('should identify success results', () => {
      const successResult = success('value')
      const failureResult = failure('error')

      expect(isSuccess(successResult)).toBe(true)
      expect(isSuccess(failureResult)).toBe(false)
    })

    it('should identify failure results', () => {
      const successResult = success('value')
      const failureResult = failure('error')

      expect(isFailure(successResult)).toBe(false)
      expect(isFailure(failureResult)).toBe(true)
    })
  })

  describe('Transformation Operations', () => {
    it('should map over success results', () => {
      const result = success(5)
      const mapped = map(result, x => x * 2)

      expect(isSuccess(mapped)).toBe(true)
      if (isSuccess(mapped)) {
        expect(mapped.data).toBe(10)
      }
    })

    it('should not map over failure results', () => {
      const result = failure('error')
      const mapped = map(result, x => (x as number) * 2)

      expect(isFailure(mapped)).toBe(true)
      if (isFailure(mapped)) {
        expect(mapped.error).toBe('error')
      }
    })

    it('should flatMap over success results', () => {
      const result = success(5)
      const flatMapped = flatMap(result, x => success(x * 2))

      expect(isSuccess(flatMapped)).toBe(true)
      if (isSuccess(flatMapped)) {
        expect(flatMapped.data).toBe(10)
      }
    })

    it('should handle flatMap with failure results', () => {
      const result = success(5)
      const flatMapped = flatMap(result, () => failure('inner error'))

      expect(isFailure(flatMapped)).toBe(true)
      if (isFailure(flatMapped)) {
        expect(flatMapped.error).toBe('inner error')
      }
    })

    it('should not flatMap over failure results', () => {
      const result = failure('error')
      const flatMapped = flatMap(result, x => success((x as number) * 2))

      expect(isFailure(flatMapped)).toBe(true)
      if (isFailure(flatMapped)) {
        expect(flatMapped.error).toBe('error')
      }
    })
  })

  describe('Pattern Matching', () => {
    it('should match success results', () => {
      const result = success(42)
      const matched = match(
        result,
        value => `Success: ${value}`,
        error => `Error: ${error}`
      )

      expect(matched).toBe('Success: 42')
    })

    it('should match failure results', () => {
      const result = failure('something went wrong')
      const matched = match(
        result,
        value => `Success: ${value}`,
        error => `Error: ${error}`
      )

      expect(matched).toBe('Error: something went wrong')
    })
  })

  describe('Unwrapping Operations', () => {
    it('should unwrap success results', () => {
      const result = success('value')
      const unwrapped = unwrap(result)

      expect(unwrapped).toBe('value')
    })

    it('should throw when unwrapping failure results', () => {
      const result = failure('error')

      expect(() => unwrap(result)).toThrow('Unwrapped a failure result')
    })

    it('should unwrap success results with default', () => {
      const result = success('value')
      const unwrapped = unwrapOr(result, 'default')

      expect(unwrapped).toBe('value')
    })

    it('should return default when unwrapping failure results', () => {
      const result = failure('error')
      const unwrapped = unwrapOr(result, 'default')

      expect(unwrapped).toBe('default')
    })
  })

  describe('Configuration Errors', () => {
    it('should create validation errors', () => {
      const error = validationError('Invalid value', { field: 'name' })

      expect(error.type).toBe(ConfigurationErrorType.VALIDATION_ERROR)
      expect(error.message).toBe('Invalid value')
      expect(error.context).toEqual({ field: 'name' })
    })

    it('should create parse errors', () => {
      const error = parseError('Cannot parse JSON', { line: 10 })

      expect(error.type).toBe(ConfigurationErrorType.PARSE_ERROR)
      expect(error.message).toBe('Cannot parse JSON')
      expect(error.context).toEqual({ line: 10 })
    })

    it('should create not found errors', () => {
      const error = notFoundError('File not found', { path: '/config.json' })

      expect(error.type).toBe(ConfigurationErrorType.NOT_FOUND)
      expect(error.message).toBe('File not found')
      expect(error.context).toEqual({ path: '/config.json' })
    })
  })

  describe('Type Safety', () => {
    it('should provide type-safe access to success data', () => {
      const result: Result<number, string> = success(42)

      if (isSuccess(result)) {
        // TypeScript knows result.data is number
        expect(typeof result.data).toBe('number')
        expect(result.data).toBe(42)
      }
    })

    it('should provide type-safe access to failure error', () => {
      const result: Result<number, string> = failure('error message')

      if (isFailure(result)) {
        // TypeScript knows result.error is string
        expect(typeof result.error).toBe('string')
        expect(result.error).toBe('error message')
      }
    })

    it('should work with complex types', () => {
      interface User {
        id: number
        name: string
      }

      const result: Result<User, ConfigurationError> = success({
        id: 1,
        name: 'John Doe',
      })

      if (isSuccess(result)) {
        expect(result.data.id).toBe(1)
        expect(result.data.name).toBe('John Doe')
      }
    })
  })

  describe('Chaining Operations', () => {
    it('should chain multiple operations', () => {
      const result = success(5)

      const finalResult = map(
        flatMap(result, x => success(x * 2)),
        x => x + 1
      )

      expect(isSuccess(finalResult)).toBe(true)
      if (isSuccess(finalResult)) {
        expect(finalResult.data).toBe(11)
      }
    })

    it('should short-circuit on first failure', () => {
      const result = success(5)

      const finalResult = map(
        flatMap(result, () => failure('error in the middle')),
        x => (x as number) + 1
      )

      expect(isFailure(finalResult)).toBe(true)
      if (isFailure(finalResult)) {
        expect(finalResult.error).toBe('error in the middle')
      }
    })
  })
})
